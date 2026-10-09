import { z } from "zod";
import {
  getAuthSession,
  hasAuthConfiguration,
  hasSanityWriteConfiguration,
} from "../../../../lib/auth";
import { isAdminEmail } from "../../../../lib/auth/access";
import { sanityClient } from "../../../../lib/sanity/client";
import { getSanityWriteClient } from "../../../../lib/sanity/write-client";
import { ADMIN_ESTABLISHMENT_BY_ID_QUERY } from "../../../../lib/sanity/queries";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const requestSchema = z
  .object({
    approvalStatus: z.enum(["pending", "approved", "rejected"]).optional(),
    isActive: z.boolean().optional(),
    ownerUserId: z.union([z.string().regex(/^[a-f0-9]{64}$/), z.null()]).optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0);

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

export async function PATCH(request: Request, { params }: RouteContext) {
  if (!hasAuthConfiguration() || !hasSanityWriteConfiguration()) {
    return Response.json({ message: "Admin access is unavailable." }, { status: 503 });
  }

  const session = await getAuthSession();
  if (!session?.user?.id || !isAdminEmail(session.user.email)) {
    return Response.json({ message: "Admin access required." }, { status: 403 });
  }

  const { id } = await params;
  if (!/^[a-zA-Z0-9_-]{1,128}$/.test(id)) {
    return Response.json({ message: "Establishment not found." }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ message: "Request body must be valid JSON." }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ message: "Provide a valid establishment status." }, { status: 400 });
  }

  const establishment = await sanityClient.fetch(
    ADMIN_ESTABLISHMENT_BY_ID_QUERY,
    { id },
    queryOptions,
  );
  if (!establishment?._rev) {
    return Response.json({ message: "Establishment not found." }, { status: 404 });
  }

  try {
    await getSanityWriteClient()
      .patch(establishment._id)
      .ifRevisionId(establishment._rev)
      .set(parsed.data)
      .commit({ visibility: "sync" });
  } catch (error) {
    if (!isSanityConflict(error)) {
      throw error;
    }

    return Response.json(
      { message: "Establishment changed. Refresh the dashboard and try again." },
      { status: 409 },
    );
  }

  return Response.json({ message: "Establishment updated." });
}
