import { cache } from "react";
import { sanityClient } from "./sanity/client";
import {
  ESTABLISHMENT_BY_SLUG_QUERY,
  FEATURED_OFFERS_QUERY,
  FOOD_CATEGORIES_QUERY,
  MARKETPLACE_CITIES_QUERY,
  MARKETPLACE_OFFERS_QUERY,
  OFFER_BY_SLUG_QUERY,
} from "./sanity/queries";

const publishedQueryOptions = {
  next: { revalidate: 0 },
  perspective: "published" as const,
};

function searchPattern(value: string | undefined) {
  const normalized = value
    ?.normalize("NFKC")
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 80);

  return normalized ? `*${normalized}*` : null;
}

export const getMarketplaceData = cache(
  async (filters: {
    category?: string;
    city?: string;
    search?: string;
    sort?: "price-low" | "price-high" | "pickup";
  } = {}) => {
    const [offers, categories, cities] = await Promise.all([
      sanityClient.fetch(
        MARKETPLACE_OFFERS_QUERY,
        {
          category: filters.category || null,
          city: filters.city || null,
          search: searchPattern(filters.search),
          sort: filters.sort ?? "pickup",
        },
        publishedQueryOptions,
      ),
      sanityClient.fetch(FOOD_CATEGORIES_QUERY, {}, publishedQueryOptions),
      sanityClient.fetch(MARKETPLACE_CITIES_QUERY, {}, publishedQueryOptions),
    ]);

    return {
      offers: offers ?? [],
      categories: categories ?? [],
      cities: cities ?? [],
    };
  },
);

export const getFoodCategories = cache(async () => {
  const categories = await sanityClient.fetch(
    FOOD_CATEGORIES_QUERY,
    {},
    publishedQueryOptions,
  );

  return categories ?? [];
});

export const getFeaturedOffers = cache(async () => {
  const offers = await sanityClient.fetch(
    FEATURED_OFFERS_QUERY,
    {},
    publishedQueryOptions,
  );

  return offers ?? [];
});

export const getOfferBySlug = cache(async (slug: string) =>
  sanityClient.fetch(OFFER_BY_SLUG_QUERY, { slug }, publishedQueryOptions),
);

export const getEstablishmentBySlug = cache(async (slug: string) =>
  sanityClient.fetch(
    ESTABLISHMENT_BY_SLUG_QUERY,
    { slug },
    publishedQueryOptions,
  ),
);
