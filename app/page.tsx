import { Footer } from "./components/layout/Footer";
import { Header } from "./components/layout/Header";
import { getHomePageContent } from "./lib/home-page";
import { OfferCard } from "./components/marketplace/OfferCard";
import { getFeaturedOffers, getFoodCategories } from "./lib/marketplace";
import Link from "next/link";

export default async function Home() {
  const [homePage, featuredOffers, categories] = await Promise.all([
    getHomePageContent(),
    getFeaturedOffers(),
    getFoodCategories(),
  ]);
  const benefits = homePage.benefits;

  return (
    <main>
      <Header
        brandName={homePage.brandName}
        navigationLabel={homePage.navigationLabel}
      />

      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-copy">
          <p className="eyebrow">
            <span className="status-dot" aria-hidden="true" />
            {homePage.heroEyebrow}
          </p>
          <h1 id="hero-title">
            {homePage.heroTitleFirstLine}
            <br />
            <span>{homePage.heroTitleSecondLine}</span>
          </h1>
          <p className="hero-description">{homePage.heroDescription}</p>
          <form className="hero-search" action="/explore" method="get">
            <label className="visually-hidden" htmlFor="home-search">
              Search food or a local shop
            </label>
            <input
              id="home-search"
              type="search"
              name="q"
              placeholder="Try bakery, lunch, coffee..."
              maxLength={80}
            />
            <button type="submit" aria-label="Search offers">
              <span aria-hidden="true">⌕</span>
            </button>
          </form>
          <Link className="primary-link" href="/explore">
            {homePage.heroCta} <span aria-hidden="true">→</span>
          </Link>
          <p className="hero-note">{homePage.heroNote}</p>
        </div>

        <div className="hero-art" role="img" aria-label={homePage.artAlt}>
          <span className="art-sun" aria-hidden="true" />
          <span className="art-label">
            {homePage.artLabelFirstLine}
            <br />
            {homePage.artLabelSecondLine}
          </span>
          <span className="fruit fruit-peach" aria-hidden="true">
            <span className="fruit-leaf" />
          </span>
          <span className="fruit fruit-pear" aria-hidden="true">
            <span className="pear-leaf" />
          </span>
          <span className="art-caption">{homePage.artCaption}</span>
          <span className="art-number">{homePage.artNumber}</span>
        </div>
      </section>

      <section className="marketplace-section" aria-labelledby="categories-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">A good thing is around the corner</p>
            <h2 id="categories-title">Shop by craving</h2>
          </div>
          <Link className="text-link" href="/explore">
            Explore everything <span aria-hidden="true">↗</span>
          </Link>
        </div>
        {categories.length ? (
          <div className="category-list">
            {categories.map((category) =>
              category.name && category.slug ? (
                <Link
                  className="category-chip"
                  href={`/explore?category=${encodeURIComponent(category.slug)}`}
                  key={category._id}
                >
                  <span className="category-chip-icon" aria-hidden="true">
                    ✳
                  </span>
                  <span>{category.name}</span>
                  <span className="category-chip-arrow" aria-hidden="true">
                    ↗
                  </span>
                </Link>
              ) : null,
            )}
          </div>
        ) : (
          <p className="marketplace-hint">
            Our local food partners are getting ready. Check back soon for
            today&apos;s finds.
          </p>
        )}
      </section>

      <section className="marketplace-section featured-section" id="featured" aria-labelledby="featured-title">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Fresh chances, every day</p>
            <h2 id="featured-title">Today&apos;s good finds</h2>
          </div>
          <Link className="text-link" href="/explore">
            See all offers <span aria-hidden="true">↗</span>
          </Link>
        </div>
        {featuredOffers.length ? (
          <div className="offer-grid">
            {featuredOffers.map((offer) => (
              <OfferCard key={offer._id} offer={offer} />
            ))}
          </div>
        ) : (
          <div className="marketplace-empty">
            <span className="marketplace-empty-mark" aria-hidden="true">
              ✳
            </span>
            <h3>Good things are on their way</h3>
            <p>
              We&apos;re welcoming local food makers to FoodSave. New offers
              will appear here as soon as they&apos;re ready.
            </p>
          </div>
        )}
      </section>

      <section
        className="intro"
        id="how-it-works"
        aria-labelledby="intro-title"
      >
        <div className="intro-heading">
          <p className="eyebrow">{homePage.introEyebrow}</p>
          <h2 id="intro-title">
            {homePage.introTitleFirstLine}
            <br />
            <span>{homePage.introTitleSecondLine}</span>
          </h2>
        </div>
        <div className="benefit-grid">
          {benefits.map((benefit) => (
            <article className="benefit" key={benefit._key ?? benefit.number}>
              <span className="benefit-number">{benefit.number}</span>
              <h3>{benefit.title}</h3>
              <p>{benefit.description}</p>
            </article>
          ))}
        </div>
      </section>

      <Footer
        brandName={homePage.brandName}
        footerMessage={homePage.footerMessage}
        footerCredit={homePage.footerCredit}
      />
    </main>
  );
}
