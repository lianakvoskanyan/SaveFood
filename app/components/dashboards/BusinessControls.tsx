"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

function getMessage(payload: unknown, fallback: string) {
  if (
    typeof payload === "object" &&
    payload !== null &&
    "message" in payload &&
    typeof payload.message === "string"
  ) {
    return payload.message;
  }

  return fallback;
}

export function BusinessOfferEditor({
  offerId,
  originalPriceAmd,
  discountedPriceAmd,
  quantity,
  publicationStatus,
}: {
  offerId: string;
  originalPriceAmd: number | null;
  discountedPriceAmd: number | null;
  quantity: number | null;
  publicationStatus: string | null;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setMessage("");
    setError(false);

    const formData = new FormData(event.currentTarget);
    const payload = {
      originalPriceAmd: Number(formData.get("originalPriceAmd")),
      discountedPriceAmd: Number(formData.get("discountedPriceAmd")),
      quantity: Number(formData.get("quantity")),
      publicationStatus: String(formData.get("publicationStatus")),
    };

    try {
      const response = await fetch(
        `/api/business/offers/${encodeURIComponent(offerId)}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const result: unknown = await response.json();
      setMessage(getMessage(result, "Offer updated."));
      setError(!response.ok);
      if (response.ok) {
        router.refresh();
      }
    } catch {
      setMessage("Could not reach the server. Please try again.");
      setError(true);
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="business-offer-form" onSubmit={save}>
      <label>
        <span>Original price (AMD)</span>
        <input
          name="originalPriceAmd"
          type="number"
          min={1}
          step={1}
          defaultValue={originalPriceAmd ?? ""}
          required
        />
      </label>
      <label>
        <span>Rescue price (AMD)</span>
        <input
          name="discountedPriceAmd"
          type="number"
          min={1}
          step={1}
          defaultValue={discountedPriceAmd ?? ""}
          required
        />
      </label>
      <label>
        <span>Total portions</span>
        <input
          name="quantity"
          type="number"
          min={1}
          step={1}
          defaultValue={quantity ?? ""}
          required
        />
      </label>
      <label>
        <span>Visibility</span>
        <select
          name="publicationStatus"
          defaultValue={publicationStatus ?? "draft"}
        >
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>
      </label>
      <button className="quiet-button" type="submit" disabled={pending}>
        {pending ? "Saving..." : "Save offer"}
      </button>
      {message ? (
        <p
          className={`form-message form-message-${error ? "error" : "success"}`}
          role={error ? "alert" : "status"}
        >
          {message}
        </p>
      ) : null}
    </form>
  );
}

export function MarkPickedUpButton({
  reservationId,
}: {
  reservationId: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);

  async function markPickedUp() {
    setPending(true);
    setMessage("");
    setError(false);

    try {
      const response = await fetch(
        `/api/business/reservations/${encodeURIComponent(reservationId)}/pickup`,
        { method: "POST" },
      );
      const payload: unknown = await response.json();
      setMessage(getMessage(payload, "Reservation updated."));
      setError(!response.ok);
      if (response.ok) {
        router.refresh();
      }
    } catch {
      setMessage("Could not reach the server. Please try again.");
      setError(true);
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="dashboard-user-control">
      <button
        className="quiet-button"
        type="button"
        disabled={pending}
        onClick={markPickedUp}
      >
        {pending ? "Saving..." : "Mark picked up"}
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
