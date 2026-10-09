"use client";

import { useRef, useState, type FormEvent } from "react";
import Link from "next/link";

function responseMessage(value: unknown, fallback: string) {
  if (
    typeof value === "object" &&
    value !== null &&
    "message" in value &&
    typeof value.message === "string"
  ) {
    return value.message;
  }

  return fallback;
}

export function ReservationForm({
  offerId,
  quantityRemaining,
  discountedPriceAmd,
}: {
  offerId: string;
  quantityRemaining: number;
  discountedPriceAmd: number;
}) {
  const [quantity, setQuantity] = useState("1");
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<{
    kind: "success" | "error";
    message: string;
  } | null>(null);
  const idempotencyKey = useRef<string | null>(null);

  async function reserve(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setResult(null);
    idempotencyKey.current ??= crypto.randomUUID();

    try {
      const response = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          offerId,
          quantity: Number(quantity),
          idempotencyKey: idempotencyKey.current,
        }),
      });
      const payload: unknown = await response.json();
      setResult({
        kind: response.ok ? "success" : "error",
        message: responseMessage(
          payload,
          response.ok
            ? "Reservation confirmed. Find it in your profile."
            : "We could not reserve this offer. Please try again.",
        ),
      });
    } catch {
      setResult({
        kind: "error",
        message:
          "We could not confirm the reservation. Retry with the same quantity to check it safely.",
      });
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="reservation-form" onSubmit={reserve}>
      <label htmlFor="reservation-quantity">Portions</label>
      <div className="reservation-controls">
        <input
          id="reservation-quantity"
          name="quantity"
          type="number"
          min={1}
          max={quantityRemaining}
          step={1}
          value={quantity}
          disabled={pending}
          onChange={(event) => {
            setQuantity(event.target.value);
            idempotencyKey.current = null;
            setResult(null);
          }}
        />
        <button className="primary-link" type="submit" disabled={pending}>
          {pending ? "Reserving..." : "Reserve"}
          <span aria-hidden="true">→</span>
        </button>
      </div>
      <p className="reservation-total">
        Total{" "}
        {new Intl.NumberFormat("hy-AM").format(
          discountedPriceAmd * (Number(quantity) || 0),
        )}{" "}
        ֏
        <span>No payment is collected in the app.</span>
      </p>
      {result ? (
        <p
          className={`form-message form-message-${result.kind}`}
          role={result.kind === "error" ? "alert" : "status"}
        >
          {result.message}
          {result.kind === "success" ? (
            <>
              {" "}
              <Link href="/profile">View your reservations</Link>
            </>
          ) : null}
        </p>
      ) : null}
    </form>
  );
}
