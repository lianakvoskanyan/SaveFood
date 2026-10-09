import { z } from "zod";
import {
  getAuthSession,
  hasAuthConfiguration,
  hasSanityWriteConfiguration,
} from "../../../../lib/auth";
import { getUserIdentityHash } from "../../../../lib/auth/access";
import { sanityClient } from "../../../../lib/sanity/client";
import { getSanityWriteClient } from "../../../../lib/sanity/write-client";
import { BUSINESS_OFFER_BY_ID_QUERY } from "../../../../lib/sanity/queries";

type RouteContext = {
  params: Promise<{ offerId: string }>;
};

const requestSchema = z
  .object({
    originalPriceAmd: z.number().int().positive().safe(),
    discountedPriceAmd: z.number().int().positive().safe(),
    quantity: z.number().int().positive().safe(),
    publicationStatus: z.enum(["draft", "published", "archived"]),
  })
  .strict()
  .refine((value) => value.discountedPriceAmd <= value.originalPriceAmd, {
    message: "Discounted price cannot exceed the original price.",
    path: ["discountedPriceAmd"],
  });

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
    return Response.json({ message: "Business access is unavailable." }, { status: 503 });
  }

  const session = await getAuthSession();
  if (!session?.user?.id) {
    return Response.json({ message: "Sign in to manage business offers." }, { status: 401 });
  }

  const { offerId } = await params;
  if (!/^[a-zA-Z0-9_-]{1,128}$/.test(offerId)) {
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
    return Response.json(
      { message: "Provide whole-number prices and quantity, with a valid publication status." },
      { status: 400 },
    );
  }

  const offer = await sanityClient.fetch(
    BUSINESS_OFFER_BY_ID_QUERY,
    { offerId },
    queryOptions,
  );
  const ownerHash = getUserIdentityHash(session.user.id);
  if (!offer || offer.establishment?.ownerUserId !== ownerHash) {
    return Response.json({ message: "Offer not found." }, { status: 404 });
  }
  if (!offer._rev) {
    throw new Error("Offer is missing a revision.");
  }

  if (
    typeof offer.quantity !== "number" ||
    typeof offer.quantityRemaining !== "number" ||
    !Number.isSafeInteger(offer.quantity) ||
    !Number.isSafeInteger(offer.quantityRemaining) ||
    offer.quantityRemaining > offer.quantity
  ) {
    return Response.json(
      { message: "Offer inventory is invalid. Contact FoodSave support." },
      { status: 409 },
    );
  }

  const committedQuantity = offer.quantity - offer.quantityRemaining;
  const quantityRemaining = parsed.data.quantity - committedQuantity;
  if (quantityRemaining < 0) {
    return Response.json(
      { message: "Listed quantity cannot be lower than already reserved portions." },
      { status: 409 },
    );
  }

  if (parsed.data.publicationStatus === "published") {
    const pickupStart = Date.parse(offer.pickupStart ?? "");
    const pickupEnd = Date.parse(offer.pickupEnd ?? "");
    const validToPublish =
      Boolean(offer.name) &&
      Boolean(offer.description) &&
      offer.hasImage === true &&
      offer.hasCategory === true &&
      offer.establishment?.isActive === true &&
      offer.establishment.approvalStatus === "approved" &&
      quantityRemaining > 0 &&
      Number.isSafeInteger(parsed.data.originalPriceAmd) &&
      Number.isSafeInteger(parsed.data.discountedPriceAmd) &&
      parsed.data.originalPriceAmd > 0 &&
      parsed.data.discountedPriceAmd > 0 &&
      parsed.data.discountedPriceAmd <= parsed.data.originalPriceAmd &&
      Number.isFinite(pickupStart) &&
      Number.isFinite(pickupEnd) &&
      pickupStart < pickupEnd &&
      pickupEnd > Date.now();

    if (!validToPublish) {
      return Response.json(
        {
          message:
            "Publishing needs an approved active establishment, image, category, valid prices, available stock, and future pickup times.",
        },
        { status: 409 },
      );
    }
  }

  try {
    await getSanityWriteClient()
      .patch(offer._id)
      .ifRevisionId(offer._rev)
      .set({
        originalPriceAmd: parsed.data.originalPriceAmd,
        discountedPriceAmd: parsed.data.discountedPriceAmd,
        quantity: parsed.data.quantity,
        quantityRemaining,
        publicationStatus: parsed.data.publicationStatus,
      })
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

  return Response.json({ message: "Offer updated." });
}
