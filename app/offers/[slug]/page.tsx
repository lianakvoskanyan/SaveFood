import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Footer } from "../../components/layout/Footer";
import { Header } from "../../components/layout/Header";
import { SanityImage } from "../../components/media/SanityImage";
import { ReservationForm } from "../../components/reservations/ReservationForm";
import { PickupWindow } from "../../components/ui/PickupWindow";
import { PriceTag } from "../../components/ui/PriceTag";
import { getAuthSession } from "../../lib/auth";
import { getHomePageContent } from "../../lib/home-page";
import { getOfferBySlug } from "../../lib/marketplace";

type OfferPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: OfferPageProps): Promise<Metadata> {
  const { slug } = await params;
  const offer = await getOfferBySlug(slug);

  return {
    title: offer ? `${offer.name} | FoodSave` : "Food offer | FoodSave",
    description: offer?.description ?? "Discover rescued food on FoodSave.",
  };
}

export default async function OfferPage({ params }: OfferPageProps) {
  const { slug } = await params;
  const [offer, content, session] = await Promise.all([
    getOfferBySlug(slug),
    getHomePageContent(),
    getAuthSession(),
  ]);

  if (
    !offer ||
    !offer.name ||
    typeof offer.originalPriceAmd !== "number" ||
    typeof offer.discountedPriceAmd !== "number" ||
    !offer.pickupStart ||
    !offer.pickupEnd ||
    typeof offer.quantityRemaining !== "number" ||
    offer.quantityRemaining < 1
  ) {
    notFound();
  }

  const discountPercent = Math.round(
    ((offer.originalPriceAmd - offer.discountedPriceAmd) /
      offer.originalPriceAmd) *
      100,
  );
  const establishment = offer.establishment;

  return (
    <main>
      <Header
        brandName={content.brandName}
        navigationLabel={content.navigationLabel}
      />
      <div className="detail-page">
        <Link className="back-link" href="/explore">
          <span aria-hidden="true">←</span> Back to all finds
        </Link>
        <section className="offer-detail" aria-labelledby="offer-title">
          <div className="offer-gallery">
            {offer.images?.[0]?.asset ? (
              <SanityImage
                value={offer.images[0]}
                alt={offer.images[0].alt ?? offer.name}
                width={1100}
                height={850}
                sizes="(max-width: 760px) 100vw, 55vw"
                priority
              />
            ) : (
              <div className="offer-image-placeholder offer-detail-placeholder">
                <span>Fresh finds, rescued daily</span>
              </div>
            )}
            {discountPercent > 0 ? (
              <span className="detail-discount">Save {discountPercent}%</span>
            ) : null}
          </div>
          <div className="offer-detail-copy">
            {offer.category?.name ? (
              <p className="eyebrow">{offer.category.name}</p>
            ) : null}
            <h1 id="offer-title">{offer.name}</h1>
            {establishment?.slug ? (
              <Link
                className="detail-establishment-link"
                href={`/establishments/${encodeURIComponent(establishment.slug)}`}
              >
                {establishment.name}
                {establishment.city ? ` · ${establishment.city}` : ""}
                <span aria-hidden="true">↗</span>
              </Link>
            ) : null}
            <p className="offer-detail-description">{offer.description}</p>
            <div className="offer-detail-price">
              <PriceTag
                originalPriceAmd={offer.originalPriceAmd}
                discountedPriceAmd={offer.discountedPriceAmd}
              />
              <span>
                {offer.quantityRemaining}{" "}
                {offer.quantityRemaining === 1 ? "left" : "left today"}
              </span>
            </div>
            <div className="offer-detail-pickup">
              <PickupWindow
                startIso={offer.pickupStart}
                endIso={offer.pickupEnd}
              />
              {establishment?.address?.street ||
              establishment?.address?.city ? (
                <p>
                  <span className="pickup-window-label">Pickup at</span>
                  {[
                    establishment.address.street,
                    establishment.address.city,
                  ]
                    .filter(Boolean)
                    .join(", ")}
                </p>
              ) : null}
              {establishment?.address?.details ? (
                <p className="pickup-note">{establishment.address.details}</p>
              ) : null}
            </div>
            {session?.user?.id && session.user.email ? (
              <ReservationForm
                offerId={offer._id}
                quantityRemaining={offer.quantityRemaining}
                discountedPriceAmd={offer.discountedPriceAmd}
              />
            ) : (
              <div className="reservation-note">
                <Link
                  className="reservation-signin-link"
                  href={`/signin?callbackUrl=${encodeURIComponent(`/offers/${slug}`)}`}
                >
                  Sign in to reserve this offer
                </Link>
                <p>No payment is collected in the app.</p>
              </div>
            )}
          </div>
        </section>
      </div>
      <Footer
        brandName={content.brandName}
        footerMessage={content.footerMessage}
        footerCredit={content.footerCredit}
      />
    </main>
  );
}
