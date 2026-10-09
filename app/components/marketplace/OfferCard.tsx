import Link from "next/link";
import { Card } from "../ui/Card";
import { Badge } from "../ui/Badge";
import { PickupWindow } from "../ui/PickupWindow";
import { PriceTag } from "../ui/PriceTag";
import { SanityImage } from "../media/SanityImage";

type OfferCardData = {
  _id: string;
  name: string | null;
  slug: string | null;
  originalPriceAmd: number | null;
  discountedPriceAmd: number | null;
  quantityRemaining: number | null;
  pickupStart: string | null;
  pickupEnd: string | null;
  images: Array<{
    _key: string;
    alt: string | null;
    asset: { _ref: string; _type: "reference" } | null;
    crop?: unknown;
    hotspot?: unknown;
  }> | null;
  category?: { name: string | null; slug?: string | null } | null;
  establishment?: {
    name: string | null;
    slug: string | null;
    city: string | null;
  } | null;
};

export function OfferCard({ offer }: { offer: OfferCardData }) {
  if (
    !offer.slug ||
    !offer.name ||
    typeof offer.originalPriceAmd !== "number" ||
    typeof offer.discountedPriceAmd !== "number" ||
    !offer.pickupStart ||
    !offer.pickupEnd
  ) {
    return null;
  }

  const image = offer.images?.[0];
  const discountPercent = Math.round(
    ((offer.originalPriceAmd - offer.discountedPriceAmd) /
      offer.originalPriceAmd) *
      100,
  );

  return (
    <Card className="offer-card">
      <Link
        className="offer-card-main"
        href={`/offers/${encodeURIComponent(offer.slug)}`}
      >
        <div className="offer-card-image">
          {image?.asset ? (
            <SanityImage
              value={image}
              alt={image.alt ?? offer.name}
              width={640}
              height={480}
              sizes="(max-width: 680px) 90vw, (max-width: 1050px) 45vw, 30vw"
            />
          ) : (
            <div className="offer-image-placeholder" aria-hidden="true">
              <span>Fresh finds, rescued daily</span>
            </div>
          )}
          {discountPercent > 0 ? (
            <Badge tone="forest">Save {discountPercent}%</Badge>
          ) : null}
        </div>
        <div className="offer-card-copy">
          <div className="offer-card-meta">
            <span>{offer.category?.name ?? "Surprise bag"}</span>
            {typeof offer.quantityRemaining === "number" ? (
              <span>{offer.quantityRemaining} left</span>
            ) : null}
          </div>
          <h3>{offer.name}</h3>
          <PriceTag
            originalPriceAmd={offer.originalPriceAmd}
            discountedPriceAmd={offer.discountedPriceAmd}
          />
          <PickupWindow startIso={offer.pickupStart} endIso={offer.pickupEnd} />
        </div>
      </Link>
      {offer.establishment?.name ? (
        <Link
          className="offer-card-establishment"
          href={
            offer.establishment.slug
              ? `/establishments/${encodeURIComponent(offer.establishment.slug)}`
              : "/explore"
          }
        >
          <span>{offer.establishment.name}</span>
          {offer.establishment.city ? (
            <span>{offer.establishment.city}</span>
          ) : null}
        </Link>
      ) : null}
    </Card>
  );
}
