import { z } from "zod";
import {
  getAuthSession,
  hasAuthConfiguration,
  hasSanityWriteConfiguration,
} from "../../../lib/auth";
import { getUserEmailHash, isAdminEmail } from "../../../lib/auth/access";
import { sanityClient } from "../../../lib/sanity/client";
import { getSanityWriteClient } from "../../../lib/sanity/write-client";
import { APP_SETTINGS_QUERY } from "../../../lib/sanity/queries";

const requestSchema = z
  .object({
    userHash: z.string().regex(/^[a-f0-9]{64}$/),
    email: z.string().email(),
    blocked: z.boolean(),
  })
  .strict();

const queryOptions = {
  next: { revalidate: 0 },
  perspective: "published" as const,
};

function isSanityConflict(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "statusCode" in error &&
    error.statusCode === 409
  );
}

export async function POST(request: Request) {
  if (!hasAuthConfiguration() || !hasSanityWriteConfiguration()) {
    return Response.json(
      { message: "Admin access is unavailable until sign-in is configured." },
      { status: 503 },
    );
  }

  const session = await getAuthSession();
  if (!session?.user?.id || !isAdminEmail(session.user.email)) {
    return Response.json({ message: "Admin access required." }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ message: "Request body must be valid JSON." }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ message: "Provide a valid account and access status." }, { status: 400 });
  }

  const settings = await sanityClient.fetch(APP_SETTINGS_QUERY, {}, queryOptions);
  const blockedUserHashes = new Set(settings?.blockedUserHashes ?? []);
  const emailHash = getUserEmailHash(parsed.data.email);
  const blockedEmailHashes = new Set(settings?.blockedEmailHashes ?? []);
  const alreadyBlocked =
    blockedUserHashes.has(parsed.data.userHash) ||
    blockedEmailHashes.has(emailHash);

  if (alreadyBlocked === parsed.data.blocked) {
    return Response.json({
      blocked: alreadyBlocked,
      message: alreadyBlocked
        ? "This account is already blocked."
        : "This account is already active.",
    });
  }

  if (!settings) {
    if (!parsed.data.blocked) {
      return Response.json({ blocked: false, message: "This account is already active." });
    }

    try {
      await getSanityWriteClient()
        .create(
          {
            _id: "foodsaveSettings",
            _type: "appSettings",
            blockedUserHashes: [parsed.data.userHash],
          },
          { visibility: "sync" },
        );
    } catch (error) {
      if (!isSanityConflict(error)) {
        throw error;
      }

      return Response.json(
        { message: "Account access changed. Refresh the dashboard and try again." },
        { status: 409 },
      );
    }

    return Response.json({ blocked: true, message: "Account blocked." });
  }

  if (!settings._rev) {
    throw new Error("App settings are missing a revision.");
  }

  if (parsed.data.blocked) {
    blockedUserHashes.add(parsed.data.userHash);
  } else {
    blockedUserHashes.delete(parsed.data.userHash);
    blockedEmailHashes.delete(emailHash);
  }

  try {
    await getSanityWriteClient()
      .patch(settings._id)
      .ifRevisionId(settings._rev)
      .set({
        blockedUserHashes: [...blockedUserHashes],
        blockedEmailHashes: [...blockedEmailHashes],
      })
      .commit({ visibility: "sync" });
  } catch (error) {
    if (!isSanityConflict(error)) {
      throw error;
    }

    return Response.json(
      { message: "Account access changed. Refresh the dashboard and try again." },
      { status: 409 },
    );
  }

  return Response.json({
    blocked: parsed.data.blocked,
    message: parsed.data.blocked ? "Account blocked." : "Account access restored.",
  });
}
