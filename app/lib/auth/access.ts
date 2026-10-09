import { createHmac } from "node:crypto";
import { sanityClient } from "../sanity/client";
import { BLOCKED_USER_ACCESS_QUERY } from "../sanity/queries";

const queryOptions = {
  next: { revalidate: 0 },
  perspective: "published" as const,
};

export function getUserIdentityHash(userId: string) {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error("Missing environment variable: NEXTAUTH_SECRET");
  }

  return createHmac("sha256", secret).update(userId).digest("hex");
}

export function getUserEmailHash(email: string) {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error("Missing environment variable: NEXTAUTH_SECRET");
  }

  return createHmac("sha256", secret)
    .update(`email:${email.trim().toLocaleLowerCase()}`)
    .digest("hex");
}

export async function isUserBlocked(userId: string, email?: string | null) {
  const userHash = getUserIdentityHash(userId);
  const blockedAccess = await sanityClient.fetch(
    BLOCKED_USER_ACCESS_QUERY,
    {},
    queryOptions,
  );

  const emailHash = email ? getUserEmailHash(email) : null;
  return Boolean(
    blockedAccess?.blockedUserHashes?.includes(userHash) ||
      (emailHash && blockedAccess?.blockedEmailHashes?.includes(emailHash)),
  );
}

export async function isEmailBlocked(email: string) {
  const blockedAccess = await sanityClient.fetch(
    BLOCKED_USER_ACCESS_QUERY,
    {},
    queryOptions,
  );

  return blockedAccess?.blockedEmailHashes?.includes(getUserEmailHash(email)) ?? false;
}

export function isAdminEmail(email: string | null | undefined) {
  const adminEmails = (process.env.FOODSAVE_ADMIN_EMAILS ?? "")
    .split(",")
    .map((value) => value.trim().toLocaleLowerCase())
    .filter(Boolean);

  return Boolean(email && adminEmails.includes(email.toLocaleLowerCase()));
}
