import { defineQuery } from "groq";

export const HOME_PAGE_QUERY = defineQuery(/* groq */ `
  *[_type == "homePage" && _id == "homePage"][0] {
    brandName,
    navigationLabel,
    heroEyebrow,
    heroTitleFirstLine,
    heroTitleSecondLine,
    heroDescription,
    heroCta,
    heroNote,
    artAlt,
    artLabelFirstLine,
    artLabelSecondLine,
    artCaption,
    artNumber,
    introEyebrow,
    introTitleFirstLine,
    introTitleSecondLine,
    "benefits": benefits[] {
      _key,
      number,
      title,
      description
    },
    footerMessage,
    footerCredit,
    seoTitle,
    seoDescription
  }
`);

export const FOOD_CATEGORIES_QUERY = defineQuery(/* groq */ `
  *[_type == "foodCategory"] | order(sortOrder asc, name asc) {
    _id,
    name,
    "slug": slug.current,
    description,
    sortOrder
  }
`);

export const MARKETPLACE_OFFERS_QUERY = defineQuery(/* groq */ `
  *[_type == "foodOffer"
    && publicationStatus == "published"
    && quantityRemaining > 0
    && pickupEnd > now()
    && establishment->isActive == true
    && establishment->approvalStatus == "approved"
  ] | order(pickupEnd asc) {
    _id,
    name,
    "slug": slug.current,
    description,
    originalPriceAmd,
    discountedPriceAmd,
    quantityRemaining,
    pickupStart,
    pickupEnd,
    "images": images[] {
      _key,
      alt,
      asset,
      crop,
      hotspot
    },
    "category": category->{
      _id,
      name,
      "slug": slug.current
    },
    "establishment": establishment->{
      _id,
      name,
      "slug": slug.current,
      city,
      "image": images[0] {
        _key,
        alt,
        asset,
        crop,
        hotspot
      }
    }
  }
`);

export const OFFER_BY_SLUG_QUERY = defineQuery(/* groq */ `
  *[_type == "foodOffer"
    && publicationStatus == "published"
    && quantityRemaining > 0
    && pickupEnd > now()
    && establishment->isActive == true
    && establishment->approvalStatus == "approved"
    && slug.current == $slug
  ][0] {
    _id,
    name,
    "slug": slug.current,
    description,
    originalPriceAmd,
    discountedPriceAmd,
    quantity,
    quantityRemaining,
    pickupStart,
    pickupEnd,
    "images": images[] {
      _key,
      alt,
      asset,
      crop,
      hotspot
    },
    "category": category->{
      _id,
      name,
      "slug": slug.current
    },
    "establishment": establishment->{
      _id,
      name,
      "slug": slug.current,
      description,
      city,
      address,
      openingHours,
      "images": images[] {
        _key,
        alt,
        asset,
        crop,
        hotspot
      }
    }
  }
`);

export const ESTABLISHMENT_BY_SLUG_QUERY = defineQuery(/* groq */ `
  *[_type == "establishment" && slug.current == $slug && isActive == true && approvalStatus == "approved"][0] {
    _id,
    name,
    "slug": slug.current,
    description,
    city,
    address,
    coordinates,
    openingHours,
    "images": images[] {
      _key,
      alt,
      asset,
      crop,
      hotspot
    },
    "category": category->{
      _id,
      name,
      "slug": slug.current
    },
    "offers": *[_type == "foodOffer"
      && publicationStatus == "published"
      && quantityRemaining > 0
      && pickupEnd > now()
      && establishment._ref == ^._id
    ] | order(pickupEnd asc) {
      _id,
      name,
      "slug": slug.current,
      originalPriceAmd,
      discountedPriceAmd,
      quantityRemaining,
      pickupStart,
      pickupEnd,
      "images": images[] {
        _key,
        alt,
        asset,
        crop,
        hotspot
      }
    }
  }
`);

export const EDITORIAL_PAGE_BY_SLUG_QUERY = defineQuery(/* groq */ `
  *[_type == "editorialPage" && slug.current == $slug][0] {
    _id,
    title,
    "slug": slug.current,
    summary,
    body,
    seoTitle,
    seoDescription
  }
`);
