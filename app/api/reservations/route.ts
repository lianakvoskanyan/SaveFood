import { z } from "zod";
import {
  getAuthSession,
  hasAuthConfiguration,
  hasSanityWriteConfiguration,
} from "../../lib/auth";
import { sanityClient } from "../../lib/sanity/client";
import { getSanityWriteClient } from "../../lib/sanity/write-client";
import {
  ACTIVE_RESERVATION_FOR_OFFER_QUERY,
  IDEMPOTENT_RESERVATION_QUERY,
  OFFER_FOR_RESERVATION_BY_ID_QUERY,
} from "../../lib/sanity/queries";

const reservationRequestSchema = z
  .object({
    offerId: z
      .string()
      .min(1)
      .max(128)
      .regex(/^[a-zA-Z0-9_-]+$/),
    quantity: z.number().int().positive().safe(),
    idempotencyKey: z.string().uuid(),
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

async function findIdempotentReservation(
  customerId: string,
  offerId: string,
  idempotencyKey: string,
) {
  return sanityClient.fetch(
    IDEMPOTENT_RESERVATION_QUERY,
    { customerId, offerId, idempotencyKey },
    queryOptions,
  );
}

async function findActiveReservation(customerId: string, offerId: string) {
  return sanityClient.fetch(
    ACTIVE_RESERVATION_FOR_OFFER_QUERY,
    { customerId, offerId },
    queryOptions,
  );
}

function existingReservationResponse(reservation: {
  _id: string;
  status: string | null;
}) {
  if (reservation.status === "reserved") {
    return Response.json({
      reservationId: reservation._id,
      status: reservation.status,
      message: "This reservation is already confirmed.",
    });
  }

  return Response.json(
    { message: "This reservation request has already been processed." },
    { status: 409 },
  );
}

export async function POST(request: Request) {
  if (!hasAuthConfiguration() || !hasSanityWriteConfiguration()) {
    return Response.json(
      { message: "Reservations are unavailable until sign-in is configured." },
      { status: 503 },
    );
  }

  const session = await getAuthSession();
  const customerId = session?.user?.id;
  const customerEmail = session?.user?.email;

  if (!customerId || !customerEmail) {
    return Response.json(
      { message: "Sign in to your FoodSave account to reserve food." },
      { status: 401 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ message: "Request body must be valid JSON." }, { status: 400 });
  }

  const parsed = reservationRequestSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      { message: "Provide a valid offer, positive whole-number quantity, and request key." },
      { status: 400 },
    );
  }

  const { offerId, quantity, idempotencyKey } = parsed.data;
  const existing = await findIdempotentReservation(
    customerId,
    offerId,
    idempotencyKey,
  );
  if (existing) {
    return existingReservationResponse(existing);
  }

  const duplicate = await findActiveReservation(customerId, offerId);
  if (duplicate) {
    return Response.json(
      { message: "You already have an active reservation for this offer." },
      { status: 409 },
    );
  }

  const currentOffer = await sanityClient.fetch(
    OFFER_FOR_RESERVATION_BY_ID_QUERY,
    { id: offerId },
    queryOptions,
  );
  const now = Date.now();
  const pickupStart = Date.parse(currentOffer?.pickupStart ?? "");
  const pickupEnd = Date.parse(currentOffer?.pickupEnd ?? "");

  if (
    !currentOffer ||
    !currentOffer._rev ||
    !currentOffer.name ||
    !currentOffer.description ||
    currentOffer.hasImage !== true ||
    currentOffer.hasCategory !== true ||
    currentOffer.publicationStatus !== "published" ||
    !currentOffer.establishment?._id ||
    currentOffer.establishment.isActive !== true ||
    currentOffer.establishment.approvalStatus !== "approved" ||
    typeof currentOffer.originalPriceAmd !== "number" ||
    !Number.isSafeInteger(currentOffer.originalPriceAmd) ||
    typeof currentOffer.discountedPriceAmd !== "number" ||
    !Number.isSafeInteger(currentOffer.discountedPriceAmd) ||
    currentOffer.originalPriceAmd <= 0 ||
    currentOffer.discountedPriceAmd <= 0 ||
    currentOffer.discountedPriceAmd > currentOffer.originalPriceAmd ||
    typeof currentOffer.quantity !== "number" ||
    !Number.isSafeInteger(currentOffer.quantity) ||
    typeof currentOffer.quantityRemaining !== "number" ||
    !Number.isSafeInteger(currentOffer.quantityRemaining) ||
    currentOffer.quantityRemaining < 1 ||
    currentOffer.quantityRemaining > currentOffer.quantity ||
    !Number.isFinite(pickupStart) ||
    !Number.isFinite(pickupEnd) ||
    pickupStart >= pickupEnd ||
    pickupEnd <= now
  ) {
    return Response.json(
      { message: "This offer is no longer available for reservation." },
      { status: 409 },
    );
  }

  if (quantity > currentOffer.quantityRemaining) {
    return Response.json(
      { message: "There are not enough portions left for that quantity." },
      { status: 409 },
    );
  }

  const writeClient = getSanityWriteClient();
  const reservation = {
    _type: "reservation" as const,
    offer: { _type: "reference" as const, _ref: currentOffer._id },
    establishment: {
      _type: "reference" as const,
      _ref: currentOffer.establishment._id,
    },
    quantity,
    status: "reserved" as const,
    customerId,
    customerEmail,
    originalPriceAmd: currentOffer.originalPriceAmd,
    discountedPriceAmd: currentOffer.discountedPriceAmd,
    pickupStart: currentOffer.pickupStart,
    pickupEnd: currentOffer.pickupEnd,
    idempotencyKey,
    inventoryRestored: false,
  };

  try {
    await writeClient
      .transaction()
      .patch(currentOffer._id, (patch) =>
        patch
          .ifRevisionId(currentOffer._rev)
          .inc({ quantityRemaining: -quantity }),
      )
      .create(reservation)
      .commit({ visibility: "sync" });
  } catch (error) {
    if (!isSanityConflict(error)) {
      throw error;
    }

    const concurrentRetry = await findIdempotentReservation(
      customerId,
      offerId,
      idempotencyKey,
    );
    if (concurrentRetry) {
      return existingReservationResponse(concurrentRetry);
    }

    const concurrentDuplicate = await findActiveReservation(customerId, offerId);
    if (concurrentDuplicate) {
      return Response.json(
        { message: "You already have an active reservation for this offer." },
        { status: 409 },
      );
    }

    return Response.json(
      { message: "Offer availability changed. Refresh the page and try again." },
      { status: 409 },
    );
  }

  const created = await findIdempotentReservation(
    customerId,
    offerId,
    idempotencyKey,
  );
  if (!created) {
    throw new Error("Reservation committed but could not be read back.");
  }

  return Response.json(
    {
      reservationId: created._id,
      status: created.status,
      message: "Reservation confirmed. Find it in your profile.",
    },
    { status: 201 },
  );
}
