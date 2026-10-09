import { Footer } from "./components/layout/Footer";
import { Header } from "./components/layout/Header";
import { getHomePageContent } from "./lib/home-page";

export default async function Home() {
  const homePage = await getHomePageContent();
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
          <a className="primary-link" href="#how-it-works">
            {homePage.heroCta} <span aria-hidden="true">→</span>
          </a>
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
