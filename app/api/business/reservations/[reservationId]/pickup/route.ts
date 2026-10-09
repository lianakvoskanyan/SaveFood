import {
  getAuthSession,
  hasAuthConfiguration,
  hasSanityWriteConfiguration,
} from "../../../../../lib/auth";
import { getUserIdentityHash } from "../../../../../lib/auth/access";
import { sanityClient } from "../../../../../lib/sanity/client";
import { getSanityWriteClient } from "../../../../../lib/sanity/write-client";
import { BUSINESS_RESERVATION_BY_ID_QUERY } from "../../../../../lib/sanity/queries";

type RouteContext = {
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

async function readReservation(reservationId: string) {
  return sanityClient.fetch(
    BUSINESS_RESERVATION_BY_ID_QUERY,
    { reservationId },
    queryOptions,
  );
}

export async function POST(_request: Request, { params }: RouteContext) {
  if (!hasAuthConfiguration() || !hasSanityWriteConfiguration()) {
    return Response.json({ message: "Business access is unavailable." }, { status: 503 });
  }

  const session = await getAuthSession();
  if (!session?.user?.id) {
    return Response.json({ message: "Sign in to manage reservations." }, { status: 401 });
  }

  const { reservationId } = await params;
  if (!/^[a-zA-Z0-9_-]{1,128}$/.test(reservationId)) {
    return Response.json({ message: "Reservation not found." }, { status: 404 });
  }

  const reservation = await readReservation(reservationId);
  const ownerHash = getUserIdentityHash(session.user.id);
  if (!reservation || reservation.establishment?.ownerUserId !== ownerHash) {
    return Response.json({ message: "Reservation not found." }, { status: 404 });
  }

  if (reservation.status === "picked_up") {
    return Response.json({ status: "picked_up", message: "Reservation already picked up." });
  }

  const pickupStart = Date.parse(reservation.pickupStart ?? "");
  const pickupEnd = Date.parse(reservation.pickupEnd ?? "");
  const now = Date.now();
  if (
    reservation.status !== "reserved" ||
    !reservation._rev ||
    !Number.isFinite(pickupStart) ||
    !Number.isFinite(pickupEnd) ||
    pickupStart > now ||
    pickupEnd <= now
  ) {
    return Response.json(
      { message: "This reservation cannot be marked as picked up right now." },
      { status: 409 },
    );
  }

  try {
    await getSanityWriteClient()
      .patch(reservation._id)
      .ifRevisionId(reservation._rev)
      .set({ status: "picked_up" })
      .commit({ visibility: "sync" });
  } catch (error) {
    if (!isSanityConflict(error)) {
      throw error;
    }

    const refreshed = await readReservation(reservationId);
    if (
      refreshed?.establishment?.ownerUserId === ownerHash &&
      refreshed.status === "picked_up"
    ) {
      return Response.json({
        status: "picked_up",
        message: "Reservation already picked up.",
      });
    }

    return Response.json(
      { message: "Reservation changed before pickup could be recorded. Refresh and try again." },
      { status: 409 },
    );
  }

  return Response.json({ status: "picked_up", message: "Reservation picked up." });
}
