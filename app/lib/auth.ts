import { getServerSession } from "next-auth";
import { authOptions } from "../../auth";
import { isUserBlocked } from "./auth/access";

export function hasAuthConfiguration() {
  return Boolean(
    process.env.NEXTAUTH_SECRET &&
      /^[a-f0-9]{64}$/i.test(process.env.AUTH_DATA_ENCRYPTION_KEY ?? ""),
  );
}

export function hasSanityWriteConfiguration() {
  return Boolean(process.env.SANITY_API_WRITE_TOKEN);
}

export function getAuthSession() {
  if (!hasAuthConfiguration()) {
    return Promise.resolve(null);
  }

  return getServerSession(authOptions).then(async (session) => {
    if (
      session?.user?.id &&
      (await isUserBlocked(session.user.id, session.user.email))
    ) {
      return null;
    }

    return session;
  });
}
