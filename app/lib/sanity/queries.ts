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
    && defined(name)
    && defined(slug.current)
    && defined(description)
    && defined(category->name)
    && defined(establishment->name)
    && defined(establishment->slug.current)
    && defined(images[0].asset._ref)
    && quantityRemaining > 0
    && quantityRemaining <= quantity
    && originalPriceAmd > 0
    && discountedPriceAmd > 0
    && discountedPriceAmd <= originalPriceAmd
    && pickupStart < pickupEnd
    && pickupEnd > now()
    && establishment->isActive == true
    && establishment->approvalStatus == "approved"
    && (!defined($category) || category->slug.current == $category)
    && (!defined($city) || establishment->city == $city)
    && (!defined($search) || name match $search || description match $search || establishment->name match $search)
  ] | order(
    select(
      $sort == "price-low" => discountedPriceAmd,
      $sort == "price-high" => 0 - discountedPriceAmd,
      pickupStart
    ) asc
  ) {
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
      address,
      "image": images[0] {
        _key,
        alt,
        asset,
        crop,
        hotspot
      }
    }
  }[0...48]
`);

export const FEATURED_OFFERS_QUERY = defineQuery(/* groq */ `
  *[_type == "foodOffer"
    && publicationStatus == "published"
    && defined(name)
    && defined(slug.current)
    && defined(description)
    && defined(category->name)
    && defined(establishment->name)
    && defined(establishment->slug.current)
    && defined(images[0].asset._ref)
    && quantityRemaining > 0
    && quantityRemaining <= quantity
    && originalPriceAmd > 0
    && discountedPriceAmd > 0
    && discountedPriceAmd <= originalPriceAmd
    && pickupStart < pickupEnd
    && pickupEnd > now()
    && establishment->isActive == true
    && establishment->approvalStatus == "approved"
  ] | order(_createdAt desc)[0...6] {
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

export const MARKETPLACE_CITIES_QUERY = defineQuery(/* groq */ `
  array::unique(*[
    _type == "establishment"
    && isActive == true
    && approvalStatus == "approved"
    && defined(city)
  ].city) | order(@ asc)
`);

export const OFFER_INVENTORY_BY_ID_QUERY = defineQuery(/* groq */ `
  *[_type == "foodOffer" && _id == $id][0] {
    _id,
    _rev,
    quantity,
    quantityRemaining
  }
`);

export const OFFER_FOR_RESERVATION_BY_ID_QUERY = defineQuery(/* groq */ `
  *[_type == "foodOffer" && _id == $id][0] {
    _id,
    _rev,
    name,
    publicationStatus,
    originalPriceAmd,
    discountedPriceAmd,
    quantity,
    quantityRemaining,
    pickupStart,
    pickupEnd,
    description,
    "hasImage": defined(images[0].asset._ref),
    "hasCategory": defined(category->name),
    "establishment": establishment->{
      _id,
      isActive,
      approvalStatus
    }
  }
`);

export const IDEMPOTENT_RESERVATION_QUERY = defineQuery(/* groq */ `
  *[_type == "reservation"
    && customerId == $customerId
    && offer._ref == $offerId
    && idempotencyKey == $idempotencyKey
  ][0] {
    _id,
    status
  }
`);

export const ACTIVE_RESERVATION_FOR_OFFER_QUERY = defineQuery(/* groq */ `
  *[_type == "reservation"
    && customerId == $customerId
    && offer._ref == $offerId
    && status == "reserved"
  ][0] {
    _id
  }
`);

export const CUSTOMER_RESERVATIONS_QUERY = defineQuery(/* groq */ `
  *[_type == "reservation" && customerId == $customerId]
    | order(_createdAt desc) {
      _id,
      _createdAt,
      quantity,
      status,
      originalPriceAmd,
      discountedPriceAmd,
      pickupStart,
      pickupEnd,
      "isCancellable": status == "reserved" && pickupEnd > now(),
      "offer": offer->{
        _id,
        name,
        "slug": slug.current,
        "image": images[0] {
          _key,
          alt,
          asset,
          crop,
          hotspot
        },
        "establishment": establishment->{
          name,
          "slug": slug.current,
          city,
          address
        }
      }
    }
`);

export const RESERVATION_FOR_CUSTOMER_QUERY = defineQuery(/* groq */ `
  *[_type == "reservation"
    && _id == $reservationId
    && customerId == $customerId
  ][0] {
    _id,
    _rev,
    quantity,
    status,
    inventoryRestored,
    pickupEnd,
    "offerId": offer._ref
  }
`);

export const APP_SETTINGS_QUERY = defineQuery(/* groq */ `
  *[_type == "appSettings" && _id == "foodsaveSettings"][0] {
    _id,
    _rev,
    blockedUserHashes,
    blockedEmailHashes
  }
`);

export const BLOCKED_USER_ACCESS_QUERY = defineQuery(/* groq */ `
  *[_type == "appSettings" && _id == "foodsaveSettings"][0] {
    blockedUserHashes,
    blockedEmailHashes
  }
`);

export const ADMIN_ESTABLISHMENTS_QUERY = defineQuery(/* groq */ `
  *[_type == "establishment"] | order(name asc)[0...500] {
    _id,
    _rev,
    name,
    "slug": slug.current,
    city,
    ownerUserId,
    isActive,
    approvalStatus
  }
`);

export const ADMIN_ESTABLISHMENT_BY_ID_QUERY = defineQuery(/* groq */ `
  *[_type == "establishment" && _id == $id][0] {
    _id,
    _rev,
    approvalStatus,
    isActive
  }
`);

export const ADMIN_OFFERS_QUERY = defineQuery(/* groq */ `
  *[_type == "foodOffer"] | order(_createdAt desc)[0...500] {
    _id,
    _rev,
    name,
    "slug": slug.current,
    publicationStatus,
    quantityRemaining,
    pickupEnd,
    "establishment": establishment->{
      name,
      city
    }
  }
`);

export const ADMIN_OFFER_BY_ID_QUERY = defineQuery(/* groq */ `
  *[_type == "foodOffer" && _id == $id][0] {
    _id,
    _rev,
    name,
    description,
    originalPriceAmd,
    discountedPriceAmd,
    quantity,
    quantityRemaining,
    pickupStart,
    pickupEnd,
    publicationStatus,
    "hasImage": defined(images[0].asset._ref),
    "hasCategory": defined(category->name),
    "establishment": establishment->{
      _id,
      isActive,
      approvalStatus
    }
  }
`);

export const ADMIN_RESERVATION_ACCOUNTS_QUERY = defineQuery(/* groq */ `
  *[_type == "reservation" && defined(customerId)]
    | order(_createdAt desc)[0...1000] {
      customerId,
      customerEmail
    }
`);

export const BUSINESS_ESTABLISHMENTS_QUERY = defineQuery(/* groq */ `
  *[_type == "establishment" && ownerUserId == $ownerHash]
    | order(name asc) {
      _id,
      _rev,
      name,
      "slug": slug.current,
      city,
      isActive,
      approvalStatus,
      "offers": *[_type == "foodOffer" && establishment._ref == ^._id]
        | order(_createdAt desc)[0...50] {
          _id,
          _rev,
          name,
          description,
          originalPriceAmd,
          discountedPriceAmd,
          quantity,
          quantityRemaining,
          pickupStart,
          pickupEnd,
          publicationStatus,
          "hasImage": defined(images[0].asset._ref),
          "hasCategory": defined(category->name),
          "slug": slug.current
        },
      "reservations": *[_type == "reservation" && establishment._ref == ^._id]
        | order(_createdAt desc)[0...100] {
          _id,
          _rev,
          _createdAt,
          quantity,
          status,
          pickupStart,
          pickupEnd,
          "canMarkPickedUp": status == "reserved"
            && pickupStart <= now()
            && pickupEnd > now(),
          customerEmail,
          "offer": offer->{name}
        }
    }
`);

export const BUSINESS_RESERVATION_BY_ID_QUERY = defineQuery(/* groq */ `
  *[_type == "reservation" && _id == $reservationId][0] {
    _id,
    _rev,
    status,
    pickupStart,
    pickupEnd,
    "establishment": establishment->{
      _id,
      ownerUserId
    }
  }
`);

export const BUSINESS_OFFER_BY_ID_QUERY = defineQuery(/* groq */ `
  *[_type == "foodOffer" && _id == $offerId][0] {
    _id,
    _rev,
    name,
    description,
    originalPriceAmd,
    discountedPriceAmd,
    quantity,
    quantityRemaining,
    pickupStart,
    pickupEnd,
    publicationStatus,
    "hasImage": defined(images[0].asset._ref),
    "hasCategory": defined(category->name),
    "establishment": establishment->{
      _id,
      ownerUserId,
      isActive,
      approvalStatus
    }
  }
`);

export const OFFER_BY_SLUG_QUERY = defineQuery(/* groq */ `
  *[_type == "foodOffer"
    && publicationStatus == "published"
    && defined(name)
    && defined(slug.current)
    && defined(description)
    && defined(category->name)
    && defined(establishment->name)
    && defined(establishment->slug.current)
    && defined(images[0].asset._ref)
    && quantityRemaining > 0
    && quantityRemaining <= quantity
    && originalPriceAmd > 0
    && discountedPriceAmd > 0
    && discountedPriceAmd <= originalPriceAmd
    && pickupStart < pickupEnd
    && pickupEnd > now()
    && establishment->isActive == true
    && establishment->approvalStatus == "approved"
    && slug.current == $slug
  ][0] {
    _id,
    _rev,
    name,
    "slug": slug.current,
    description,
    originalPriceAmd,
    discountedPriceAmd,
    quantity,
    quantityRemaining,
    pickupStart,
    pickupEnd,
    "hasImage": defined(images[0].asset._ref),
    "hasCategory": defined(category->name),
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
  *[_type == "establishment"
    && slug.current == $slug
    && defined(name)
    && defined(description)
    && isActive == true
    && approvalStatus == "approved"
  ][0] {
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
      && defined(name)
      && defined(slug.current)
      && defined(description)
      && defined(category->name)
      && defined(images[0].asset._ref)
      && defined(name)
      && defined(slug.current)
      && defined(description)
      && quantityRemaining > 0
      && quantityRemaining <= quantity
      && originalPriceAmd > 0
      && discountedPriceAmd > 0
      && discountedPriceAmd <= originalPriceAmd
      && pickupStart < pickupEnd
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
