"use client";

import { useState } from "react";

export function CancelReservationButton({
  reservationId,
}: {
  reservationId: string;
}) {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);

  async function cancel() {
    if (!window.confirm("Cancel this reservation? Its portions will be listed again.")) {
      return;
    }

    setPending(true);
    setMessage("");
    setError(false);

    try {
      const response = await fetch(
        `/api/reservations/${encodeURIComponent(reservationId)}/cancel`,
        { method: "POST" },
      );
      const payload: unknown = await response.json();
      const responseText =
        typeof payload === "object" &&
        payload !== null &&
        "message" in payload &&
        typeof payload.message === "string"
          ? payload.message
          : response.ok
            ? "Reservation cancelled."
            : "We could not cancel this reservation.";

      setMessage(responseText);
      setError(!response.ok);
      if (response.ok) {
        window.location.reload();
      }
    } catch {
      setMessage("We could not confirm cancellation. Please refresh your reservations.");
      setError(true);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="cancel-reservation-action">
      <button
        className="quiet-button"
        type="button"
        disabled={pending}
        onClick={cancel}
      >
        {pending ? "Cancelling..." : "Cancel reservation"}
      </button>
      {message ? (
        <p
          className={`form-message form-message-${error ? "error" : "success"}`}
          role={error ? "alert" : "status"}
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
