import {
  getAuthSession,
  hasAuthConfiguration,
  hasSanityWriteConfiguration,
} from "../../../../lib/auth";
import { sanityClient } from "../../../../lib/sanity/client";
import { getSanityWriteClient } from "../../../../lib/sanity/write-client";
import {
  OFFER_INVENTORY_BY_ID_QUERY,
  RESERVATION_FOR_CUSTOMER_QUERY,
} from "../../../../lib/sanity/queries";

type CancelRouteContext = {
  params: Promise<{ reservationId: string }>;
};

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

async function loadCustomerReservation(
  reservationId: string,
  customerId: string,
) {
  return sanityClient.fetch(
    RESERVATION_FOR_CUSTOMER_QUERY,
    { reservationId, customerId },
    queryOptions,
  );
}

function cancelledResponse() {
  return Response.json({
    status: "cancelled",
    message: "Reservation cancelled and portions returned to the offer.",
  });
}

export async function POST(_request: Request, { params }: CancelRouteContext) {
  if (!hasAuthConfiguration() || !hasSanityWriteConfiguration()) {
    return Response.json(
      { message: "Reservations are unavailable until sign-in is configured." },
      { status: 503 },
    );
  }

  const session = await getAuthSession();
  const customerId = session?.user?.id;
  if (!customerId) {
    return Response.json({ message: "Sign in to manage reservations." }, { status: 401 });
  }

  const { reservationId } = await params;
  if (!/^[a-zA-Z0-9_-]{1,128}$/.test(reservationId)) {
    return Response.json({ message: "Reservation not found." }, { status: 404 });
  }

  const reservation = await loadCustomerReservation(reservationId, customerId);
  if (!reservation) {
    return Response.json({ message: "Reservation not found." }, { status: 404 });
  }

  if (reservation.status === "cancelled" && reservation.inventoryRestored === true) {
    return cancelledResponse();
  }

  const quantity = reservation.quantity;
  if (
    reservation.status !== "reserved" ||
    reservation.inventoryRestored === true ||
    typeof quantity !== "number" ||
    !Number.isSafeInteger(quantity) ||
    quantity < 1 ||
    !reservation.offerId
  ) {
    return Response.json(
      { message: "This reservation can no longer be cancelled." },
      { status: 409 },
    );
  }

  if (!reservation.pickupEnd || Date.parse(reservation.pickupEnd) <= Date.now()) {
    return Response.json(
      { message: "Reservations cannot be cancelled after the pickup window ends." },
      { status: 409 },
    );
  }

  const offer = await sanityClient.fetch(
    OFFER_INVENTORY_BY_ID_QUERY,
    { id: reservation.offerId },
    queryOptions,
  );
  if (
    !offer ||
    !offer._rev ||
    typeof offer.quantity !== "number" ||
    !Number.isSafeInteger(offer.quantity) ||
    typeof offer.quantityRemaining !== "number" ||
    !Number.isSafeInteger(offer.quantityRemaining) ||
    offer.quantityRemaining + quantity > offer.quantity
  ) {
    return Response.json(
      { message: "The offer inventory changed. Contact FoodSave support to cancel." },
      { status: 409 },
    );
  }

  try {
    await getSanityWriteClient()
      .transaction()
      .patch(offer._id, (patch) =>
        patch
          .ifRevisionId(offer._rev)
          .inc({ quantityRemaining: quantity }),
      )
      .patch(reservation._id, (patch) =>
        patch
          .ifRevisionId(reservation._rev)
          .set({ status: "cancelled", inventoryRestored: true }),
      )
      .commit({ visibility: "sync" });
  } catch (error) {
    if (!isSanityConflict(error)) {
      throw error;
    }

    const refreshed = await loadCustomerReservation(reservationId, customerId);
    if (refreshed?.status === "cancelled" && refreshed.inventoryRestored === true) {
      return cancelledResponse();
    }

    return Response.json(
      { message: "Reservation changed before cancellation could complete. Refresh and try again." },
      { status: 409 },
    );
  }

  return cancelledResponse();
}
