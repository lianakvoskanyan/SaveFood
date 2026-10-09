import type { Metadata } from "next";
import { Footer } from "../components/layout/Footer";
import { Header } from "../components/layout/Header";
import { OfferCard } from "../components/marketplace/OfferCard";
import { OfferFilters } from "../components/marketplace/OfferFilters";
import { EmptyState } from "../components/ui/EmptyState";
import { getHomePageContent } from "../lib/home-page";
import { getMarketplaceData } from "../lib/marketplace";

export const metadata: Metadata = {
  title: "Explore rescued food | FoodSave",
  description:
    "Find delicious food from local Armenian shops and restaurants at a better price.",
};

type SearchParams = Promise<{
  q?: string | string[];
  category?: string | string[];
  city?: string | string[];
  sort?: string | string[];
}>;

function firstValue(value: string | string[] | undefined) {
  return (Array.isArray(value) ? value[0] : value)?.trim().slice(0, 80);
}

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const search = firstValue(params.q);
  const category = firstValue(params.category);
  const city = firstValue(params.city);
  const requestedSort = firstValue(params.sort);
  const sort =
    requestedSort === "price-low" || requestedSort === "price-high"
      ? requestedSort
      : "pickup";

  const [content, marketplace] = await Promise.all([
    getHomePageContent(),
    getMarketplaceData({ category, city, search, sort }),
  ]);

  return (
    <main>
      <Header
        brandName={content.brandName}
        navigationLabel={content.navigationLabel}
      />
      <section className="catalog-heading" aria-labelledby="catalog-title">
        <p className="eyebrow">Good food, nearby</p>
        <h1 id="catalog-title">Find your next good thing.</h1>
        <p>
          Discover lovely food from local makers, saved for a second chance.
        </p>
      </section>
      <section className="catalog-section" aria-label="Food offers">
        <OfferFilters
          categories={marketplace.categories}
          cities={marketplace.cities}
          search={search}
          category={category}
          city={city}
          sort={sort}
        />
        <div className="catalog-results">
          <div className="catalog-results-heading">
            <h2>{search ? `Results for “${search}”` : "Available near you"}</h2>
            <span>
              {marketplace.offers.length === 48
                ? "Showing 48+ offers"
                : `${marketplace.offers.length} offers`}
            </span>
          </div>
          {marketplace.offers.length ? (
            <div className="offer-grid">
              {marketplace.offers.map((offer) => (
                <OfferCard key={offer._id} offer={offer} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="No good finds just yet"
              description="Try another search or clear a filter. New rescued food is added as local partners list it."
            />
          )}
        </div>
      </section>
      <Footer
        brandName={content.brandName}
        footerMessage={content.footerMessage}
        footerCredit={content.footerCredit}
      />
    </main>
  );
}
