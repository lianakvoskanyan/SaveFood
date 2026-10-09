import Link from "next/link";
import { redirect } from "next/navigation";
import { CancelReservationButton } from "../components/reservations/CancelReservationButton";
import { SignOutButton } from "../components/auth/SignOutButton";
import { Header } from "../components/layout/Header";
import { Footer } from "../components/layout/Footer";
import { SanityImage } from "../components/media/SanityImage";
import { getAuthSession } from "../lib/auth";
import { formatAmd, formatPickupWindow } from "../lib/format";
import { getHomePageContent } from "../lib/home-page";
import { sanityClient } from "../lib/sanity/client";
import { CUSTOMER_RESERVATIONS_QUERY } from "../lib/sanity/queries";

export default async function ProfilePage() {
  const session = await getAuthSession();
  if (!session?.user?.id || !session.user.email) {
    redirect("/signin?callbackUrl=%2Fprofile");
  }

  const [content, reservations] = await Promise.all([
    getHomePageContent(),
    sanityClient.fetch(
      CUSTOMER_RESERVATIONS_QUERY,
      { customerId: session.user.id },
      {
        next: { revalidate: 0 },
        perspective: "published",
      },
    ),
  ]);

  return (
    <main>
      <Header
        brandName={content.brandName}
        navigationLabel={content.navigationLabel}
      />
      <section className="profile-page" aria-labelledby="profile-title">
        <div className="profile-heading">
          <div>
            <p className="eyebrow">Your FoodSave account</p>
            <h1 id="profile-title">Good to see you, {session.user.name ?? "friend"}.</h1>
            <p>{session.user.email}</p>
          </div>
          <SignOutButton />
        </div>
        <div className="profile-section-heading">
          <h2>Your reservations</h2>
          <Link className="text-link" href="/explore">
            Find more good food <span aria-hidden="true">↗</span>
          </Link>
        </div>
        {reservations?.length ? (
          <div className="reservation-list">
            {reservations.map((reservation) => {
              const offer = reservation.offer;
              const establishment = offer?.establishment;
              const image = offer?.image;
              const canCancel = reservation.isCancellable === true;

              return (
                <article className="reservation-card" key={reservation._id}>
                  {image?.asset ? (
                    <SanityImage
                      value={image}
                      alt={image.alt ?? offer?.name ?? "Reserved food"}
                      width={320}
                      height={240}
                      sizes="(max-width: 600px) 30vw, 180px"
                    />
                  ) : (
                    <div className="reservation-image-placeholder" aria-hidden="true">
                      ✳
                    </div>
                  )}
                  <div className="reservation-card-copy">
                    <div className="reservation-card-heading">
                      {offer?.slug ? (
                        <Link href={`/offers/${encodeURIComponent(offer.slug)}`}>
                          <h3>{offer.name ?? "Reserved food"}</h3>
                        </Link>
                      ) : (
                        <h3>{offer?.name ?? "Reserved food"}</h3>
                      )}
                      <span className={`reservation-status status-${reservation.status ?? "unknown"}`}>
                        {(reservation.status ?? "unknown").replace("_", " ")}
                      </span>
                    </div>
                    <p className="reservation-shop">
                      {[establishment?.name, establishment?.city]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                    {reservation.pickupStart && reservation.pickupEnd ? (
                      <p className="reservation-pickup">
                        Pickup{" "}
                        {formatPickupWindow(
                          reservation.pickupStart,
                          reservation.pickupEnd,
                        )}
                      </p>
                    ) : null}
                    <p className="reservation-total">
                      {reservation.quantity ?? 0} portions ·{" "}
                      {formatAmd(
                        (reservation.discountedPriceAmd ?? 0) *
                          (reservation.quantity ?? 0),
                      )}
                    </p>
                    {canCancel ? (
                      <CancelReservationButton reservationId={reservation._id} />
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="marketplace-empty">
            <span className="marketplace-empty-mark" aria-hidden="true">
              ✳
            </span>
            <h3>Your good finds will live here</h3>
            <p>When you reserve rescued food, your pickup details will appear here.</p>
            <Link className="primary-link" href="/explore">
              Explore offers <span aria-hidden="true">→</span>
            </Link>
          </div>
        )}
      </section>
      <Footer
        brandName={content.brandName}
        footerMessage={content.footerMessage}
        footerCredit={content.footerCredit}
      />
    </main>
  );
}
