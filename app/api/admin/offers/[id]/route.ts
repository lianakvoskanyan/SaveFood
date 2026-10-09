import { z } from "zod";
import {
  getAuthSession,
  hasAuthConfiguration,
  hasSanityWriteConfiguration,
} from "../../../../lib/auth";
import { isAdminEmail } from "../../../../lib/auth/access";
import { sanityClient } from "../../../../lib/sanity/client";
import { getSanityWriteClient } from "../../../../lib/sanity/write-client";
import { ADMIN_OFFER_BY_ID_QUERY } from "../../../../lib/sanity/queries";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const requestSchema = z
  .object({
    publicationStatus: z.enum(["draft", "published", "archived"]),
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
    return Response.json({ message: "Offer not found." }, { status: 404 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ message: "Request body must be valid JSON." }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json({ message: "Provide a valid publication status." }, { status: 400 });
  }

  const offer = await sanityClient.fetch(ADMIN_OFFER_BY_ID_QUERY, { id }, queryOptions);
  if (!offer?._rev) {
    return Response.json({ message: "Offer not found." }, { status: 404 });
  }

  if (parsed.data.publicationStatus === "published") {
    const pickupStart = Date.parse(offer.pickupStart ?? "");
    const pickupEnd = Date.parse(offer.pickupEnd ?? "");
    const validToPublish =
      Boolean(offer.name) &&
      Boolean(offer.description) &&
      offer.hasImage === true &&
      offer.establishment?.isActive === true &&
      offer.establishment.approvalStatus === "approved" &&
      Number.isSafeInteger(offer.originalPriceAmd) &&
      Number.isSafeInteger(offer.discountedPriceAmd) &&
      typeof offer.originalPriceAmd === "number" &&
      typeof offer.discountedPriceAmd === "number" &&
      offer.originalPriceAmd > 0 &&
      offer.discountedPriceAmd > 0 &&
      offer.discountedPriceAmd <= offer.originalPriceAmd &&
      typeof offer.quantity === "number" &&
      typeof offer.quantityRemaining === "number" &&
      Number.isSafeInteger(offer.quantity) &&
      Number.isSafeInteger(offer.quantityRemaining) &&
      offer.quantityRemaining > 0 &&
      offer.quantityRemaining <= offer.quantity &&
      Number.isFinite(pickupStart) &&
      Number.isFinite(pickupEnd) &&
      pickupStart < pickupEnd &&
      pickupEnd > Date.now();

    if (!validToPublish) {
      return Response.json(
        {
          message:
            "The offer needs valid content, image, prices, available stock, future pickup times, and an approved active establishment before publishing.",
        },
        { status: 409 },
      );
    }
  }

  try {
    await getSanityWriteClient()
      .patch(offer._id)
      .ifRevisionId(offer._rev)
      .set({ publicationStatus: parsed.data.publicationStatus })
      .commit({ visibility: "sync" });
  } catch (error) {
    if (!isSanityConflict(error)) {
      throw error;
    }

    return Response.json(
      { message: "Offer changed. Refresh the dashboard and try again." },
      { status: 409 },
    );
  }

  return Response.json({ message: "Offer publication status updated." });
}
