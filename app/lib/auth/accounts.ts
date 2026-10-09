import {
  createCipheriv,
  createDecipheriv,
  createHmac,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";
import {sanityClient} from "../sanity/client";
import {getSanityWriteClient} from "../sanity/write-client";

const PASSWORD_SALT_BYTES = 16;
const PASSWORD_KEY_BYTES = 64;

type AuthAccountDocument = {
  _id: string;
  sealedCredentials?: string;
};

type AuthAccountData = {
  username: string;
  email: string;
  passwordSalt: string;
  passwordHash: string;
};

function getKey(name: string, bytes: number) {
  const key = process.env[name];
  if (!key || !new RegExp(`^[a-f0-9]{${bytes * 2}}$`, "i").test(key)) {
    throw new Error(`${name} must be a ${bytes}-byte hexadecimal key.`);
  }

  return Buffer.from(key, "hex");
}

function getIdentitySecret() {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("Missing environment variable: NEXTAUTH_SECRET");
  return secret;
}

function getAccountAccessHash(accountId: string) {
  return createHmac("sha256", getIdentitySecret()).update(accountId).digest("hex");
}

function getLookupDocumentId(kind: "email" | "username", value: string) {
  const digest = createHmac("sha256", getIdentitySecret())
    .update(`${kind}:${value.trim().toLocaleLowerCase()}`)
    .digest("hex");
  return `authLookup-${digest}`;
}

function sealAccount(account: AuthAccountData) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", getKey("AUTH_DATA_ENCRYPTION_KEY", 32), iv);
  const ciphertext = Buffer.concat([
    cipher.update(JSON.stringify(account), "utf8"),
    cipher.final(),
  ]);

  return [
    "v1",
    iv.toString("base64url"),
    cipher.getAuthTag().toString("base64url"),
    ciphertext.toString("base64url"),
  ].join(".");
}

function openAccount(value: string): AuthAccountData {
  const [version, encodedIv, encodedTag, encodedCiphertext] = value.split(".");
  if (!encodedIv || !encodedTag || !encodedCiphertext || version !== "v1") {
    throw new Error("Stored account credentials have an invalid format.");
  }

  const decipher = createDecipheriv(
    "aes-256-gcm",
    getKey("AUTH_DATA_ENCRYPTION_KEY", 32),
    Buffer.from(encodedIv, "base64url"),
  );
  decipher.setAuthTag(Buffer.from(encodedTag, "base64url"));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(encodedCiphertext, "base64url")),
    decipher.final(),
  ]).toString("utf8");
  const parsed: unknown = JSON.parse(plaintext);
  if (
    typeof parsed !== "object" ||
    parsed === null ||
    !("username" in parsed) ||
    typeof parsed.username !== "string" ||
    !("email" in parsed) ||
    typeof parsed.email !== "string" ||
    !("passwordSalt" in parsed) ||
    typeof parsed.passwordSalt !== "string" ||
    !("passwordHash" in parsed) ||
    typeof parsed.passwordHash !== "string"
  ) {
    throw new Error("Stored account credentials are incomplete.");
  }

  return parsed as AuthAccountData;
}

function hashPassword(password: string, salt: Buffer) {
  return scryptSync(password, salt, PASSWORD_KEY_BYTES).toString("base64url");
}

export function verifyPassword(password: string, salt: string, expectedHash: string) {
  const saltBytes = Buffer.from(salt, "base64url");
  const expectedBytes = Buffer.from(expectedHash, "base64url");
  if (
    saltBytes.length !== PASSWORD_SALT_BYTES ||
    expectedBytes.length !== PASSWORD_KEY_BYTES
  ) {
    return false;
  }

  const actualBytes = Buffer.from(hashPassword(password, saltBytes), "base64url");
  return timingSafeEqual(actualBytes, expectedBytes);
}

export async function createLocalAccount({
  username,
  email,
  password,
}: {
  username: string;
  email: string;
  password: string;
}) {
  const normalizedUsername = username.trim().toLocaleLowerCase();
  const normalizedEmail = email.trim().toLocaleLowerCase();
  const salt = randomBytes(PASSWORD_SALT_BYTES);
  const client = getSanityWriteClient();
  const usernameLookupId = getLookupDocumentId("username", normalizedUsername);
  const emailLookupId = getLookupDocumentId("email", normalizedEmail);
  const existingUsername = await client.getDocument(usernameLookupId);
  if (existingUsername) return "username";
  if (await client.getDocument(emailLookupId)) return "email";

  const createdAccount = await client.create(
    {
      _type: "authAccount",
      sealedCredentials: sealAccount({
        username: normalizedUsername,
        email: normalizedEmail,
        passwordSalt: salt.toString("base64url"),
        passwordHash: hashPassword(password, salt),
      }),
      createdAt: new Date().toISOString(),
    },
    {visibility: "sync"},
  );
  let account: typeof createdAccount;
  try {
    account = await client
      .patch(createdAccount._id)
      .ifRevisionId(createdAccount._rev)
      .set({accessHash: getAccountAccessHash(createdAccount._id)})
      .commit({visibility: "sync"});
  } catch (error) {
    await client.delete(createdAccount._id);
    throw error;
  }

  try {
    await client
      .transaction()
      .create({
        _id: usernameLookupId,
        _type: "authAccountLookup",
        account: {_type: "reference", _ref: account._id},
      })
      .create({
        _id: emailLookupId,
        _type: "authAccountLookup",
        account: {_type: "reference", _ref: account._id},
      })
      .commit({visibility: "sync"});
  } catch (error) {
    const [usernameLookup, emailLookup] = await Promise.all([
      client.getDocument<{account?: {_ref?: string}}>(usernameLookupId),
      client.getDocument<{account?: {_ref?: string}}>(emailLookupId),
    ]);
    if (
      usernameLookup?.account?._ref === account._id &&
      emailLookup?.account?._ref === account._id
    ) {
      return "created";
    }

    const usernameTaken = Boolean(usernameLookup);
    const emailTaken = Boolean(emailLookup);
    await client.delete(account._id);
    if (usernameTaken) return "username";
    if (emailTaken) return "email";
    if (
      typeof error === "object" &&
      error !== null &&
      "statusCode" in error &&
      error.statusCode === 409
    ) {
      return "email";
    }

    throw error;
  }

  return "created";
}

export async function authenticateLocalAccount(login: string, password: string) {
  const normalizedLogin = login.trim().toLocaleLowerCase();
  const client = sanityClient;
  const lookupId = getLookupDocumentId(
    normalizedLogin.includes("@") ? "email" : "username",
    normalizedLogin,
  );
  const lookup = await client.getDocument<{account?: {_ref?: string}}>(lookupId);
  const accountDocument = lookup?.account?._ref
    ? await client.getDocument<AuthAccountDocument>(lookup.account._ref)
    : null;

  if (!accountDocument?.sealedCredentials) {
    return null;
  }

  const account = openAccount(accountDocument.sealedCredentials);
  if (!verifyPassword(password, account.passwordSalt, account.passwordHash)) return null;

  return {
    id: accountDocument._id,
    email: account.email,
    name: account.username,
  };
}
