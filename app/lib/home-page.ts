import { cache } from "react";
import type { HOME_PAGE_QUERY_RESULT } from "../../sanity.types";
import { sanityClient } from "./sanity/client";
import { HOME_PAGE_QUERY } from "./sanity/queries";

export { HOME_PAGE_QUERY };

type QueryHomePage = Exclude<HOME_PAGE_QUERY_RESULT, null>;
type QueryBenefit = NonNullable<NonNullable<QueryHomePage["benefits"]>[number]>;
type HomePageContent = {
  [Field in Exclude<keyof QueryHomePage, "benefits">]-?: NonNullable<
    QueryHomePage[Field]
  >;
} & {
  benefits: QueryBenefit[];
};

export const homePageDefaults: HomePageContent = {
  brandName: "foodsave",
  navigationLabel: "How it works",
  heroEyebrow: "A little good goes a long way",
  heroTitleFirstLine: "Save food.",
  heroTitleSecondLine: "Feel good.",
  heroDescription:
    "Your next great meal might be the one that almost went to waste. Discover lovely local food at a lovely little price.",
  heroCta: "Let’s make a difference",
  heroNote: "Good food deserves another chance.",
  artAlt: "A fresh pear and peach",
  artLabelFirstLine: "A GOOD",
  artLabelSecondLine: "THING GROWING",
  artCaption: "A second life looks good on you.",
  artNumber: "№ 001 — BETTER TOGETHER",
  introEyebrow: "The feel-good food club",
  introTitleFirstLine: "A win for your wallet.",
  introTitleSecondLine: "A little win for the world.",
  benefits: [
    {
      _key: "benefit-1",
      number: "01",
      title: "Good food, rescued",
      description:
        "Find delicious food from local shops and restaurants before it goes to waste.",
    },
    {
      _key: "benefit-2",
      number: "02",
      title: "A little more affordable",
      description:
        "Pick up surprise bags of great food for a fraction of the usual price.",
    },
    {
      _key: "benefit-3",
      number: "03",
      title: "Better for our planet",
      description:
        "Every rescued meal is a small, feel-good step towards less food waste.",
    },
  ],
  footerMessage: "Good food. Less waste. More good days.",
  footerCredit: "Made for a brighter table © 2025",
  seoTitle: "FoodSave",
  seoDescription: "Save good food from going to waste.",
};

export const getHomePageContent = cache(async (): Promise<HomePageContent> => {
  const content = await sanityClient.fetch(
    HOME_PAGE_QUERY,
    {},
    { next: { revalidate: 0 }, perspective: "published" },
  );

  return {
    brandName: content?.brandName ?? homePageDefaults.brandName,
    navigationLabel:
      content?.navigationLabel ?? homePageDefaults.navigationLabel,
    heroEyebrow: content?.heroEyebrow ?? homePageDefaults.heroEyebrow,
    heroTitleFirstLine:
      content?.heroTitleFirstLine ?? homePageDefaults.heroTitleFirstLine,
    heroTitleSecondLine:
      content?.heroTitleSecondLine ?? homePageDefaults.heroTitleSecondLine,
    heroDescription:
      content?.heroDescription ?? homePageDefaults.heroDescription,
    heroCta: content?.heroCta ?? homePageDefaults.heroCta,
    heroNote: content?.heroNote ?? homePageDefaults.heroNote,
    artAlt: content?.artAlt ?? homePageDefaults.artAlt,
    artLabelFirstLine:
      content?.artLabelFirstLine ?? homePageDefaults.artLabelFirstLine,
    artLabelSecondLine:
      content?.artLabelSecondLine ?? homePageDefaults.artLabelSecondLine,
    artCaption: content?.artCaption ?? homePageDefaults.artCaption,
    artNumber: content?.artNumber ?? homePageDefaults.artNumber,
    introEyebrow: content?.introEyebrow ?? homePageDefaults.introEyebrow,
    introTitleFirstLine:
      content?.introTitleFirstLine ?? homePageDefaults.introTitleFirstLine,
    introTitleSecondLine:
      content?.introTitleSecondLine ?? homePageDefaults.introTitleSecondLine,
    benefits:
      content?.benefits?.map((benefit) => ({
        _key: benefit._key,
        number: benefit.number ?? "",
        title: benefit.title ?? "",
        description: benefit.description ?? "",
      })) ?? homePageDefaults.benefits,
    footerMessage: content?.footerMessage ?? homePageDefaults.footerMessage,
    footerCredit: content?.footerCredit ?? homePageDefaults.footerCredit,
    seoTitle: content?.seoTitle ?? homePageDefaults.seoTitle,
    seoDescription: content?.seoDescription ?? homePageDefaults.seoDescription,
  };
});
