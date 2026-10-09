import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Footer } from "../../components/layout/Footer";
import { Header } from "../../components/layout/Header";
import { OfferCard } from "../../components/marketplace/OfferCard";
import { SanityImage } from "../../components/media/SanityImage";
import { EmptyState } from "../../components/ui/EmptyState";
import { getEstablishmentBySlug } from "../../lib/marketplace";
import { getHomePageContent } from "../../lib/home-page";

type EstablishmentPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: EstablishmentPageProps): Promise<Metadata> {
  const { slug } = await params;
  const establishment = await getEstablishmentBySlug(slug);

  return {
    title: establishment
      ? `${establishment.name} | FoodSave`
      : "Local food partner | FoodSave",
    description:
      establishment?.description ??
      "Discover delicious rescued food from a local FoodSave partner.",
  };
}

export default async function EstablishmentPage({
  params,
}: EstablishmentPageProps) {
  const { slug } = await params;
  const [establishment, content] = await Promise.all([
    getEstablishmentBySlug(slug),
    getHomePageContent(),
  ]);

  if (!establishment) {
    notFound();
  }

  const heroImage = establishment.images?.[0];

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
        <section className="establishment-hero">
          <div className="establishment-hero-image">
            {heroImage?.asset ? (
              <SanityImage
                value={heroImage}
                alt={heroImage.alt ?? establishment.name ?? "Local food partner"}
                width={1200}
                height={700}
                sizes="(max-width: 760px) 100vw, 90vw"
                priority
              />
            ) : (
              <div className="offer-image-placeholder offer-detail-placeholder">
                <span>Food made with care</span>
              </div>
            )}
          </div>
          <div className="establishment-hero-copy">
            {establishment.category?.name ? (
              <p className="eyebrow">{establishment.category.name}</p>
            ) : null}
            <h1>{establishment.name}</h1>
            <p>{establishment.description}</p>
            <div className="establishment-address">
              <span aria-hidden="true">⌖</span>
              <span>
                {[
                  establishment.address?.street,
                  establishment.address?.city ?? establishment.city,
                ]
                  .filter(Boolean)
                  .join(", ")}
              </span>
            </div>
            {establishment.address?.details ? (
              <p className="pickup-note">{establishment.address.details}</p>
            ) : null}
          </div>
        </section>

        <section className="establishment-offers" aria-labelledby="offers-title">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Rescued with care</p>
              <h2 id="offers-title">Available from {establishment.name}</h2>
            </div>
          </div>
          {establishment.offers?.length ? (
            <div className="offer-grid">
              {establishment.offers.map((offer) => (
                <OfferCard key={offer._id} offer={offer} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No offers available right now"
              description="Check back soon. This food partner adds rescued finds as they become available."
            />
          )}
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
