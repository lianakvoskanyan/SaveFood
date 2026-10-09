import { redirect } from "next/navigation";
import { BusinessOfferEditor, MarkPickedUpButton } from "../components/dashboards/BusinessControls";
import { Footer } from "../components/layout/Footer";
import { Header } from "../components/layout/Header";
import { EmptyState } from "../components/ui/EmptyState";
import { getAuthSession } from "../lib/auth";
import { getUserIdentityHash } from "../lib/auth/access";
import { formatAmd, formatPickupWindow } from "../lib/format";
import { getHomePageContent } from "../lib/home-page";
import { sanityClient } from "../lib/sanity/client";
import { BUSINESS_ESTABLISHMENTS_QUERY } from "../lib/sanity/queries";

const queryOptions = {
  next: { revalidate: 0 },
  perspective: "published" as const,
};

export default async function BusinessDashboardPage() {
  const session = await getAuthSession();
  if (!session?.user?.id || !session.user.email) {
    redirect("/signin?callbackUrl=%2Fbusiness");
  }

  const ownerHash = getUserIdentityHash(session.user.id);
  const [content, establishments] = await Promise.all([
    getHomePageContent(),
    sanityClient.fetch(
      BUSINESS_ESTABLISHMENTS_QUERY,
      { ownerHash },
      queryOptions,
    ),
  ]);

  return (
    <main>
      <Header
        brandName={content.brandName}
        navigationLabel={content.navigationLabel}
      />
      <section className="dashboard-page" aria-labelledby="business-title">
        <div className="dashboard-heading">
          <div>
            <p className="eyebrow">Your local food business</p>
            <h1 id="business-title">Business dashboard</h1>
            <p>Keep offers current and make every pickup a good one.</p>
          </div>
          <span className="dashboard-role">Business</span>
        </div>

        {establishments?.length ? (
          establishments.map((establishment) => (
            <section
              className="business-establishment-section"
              key={establishment._id}
              aria-labelledby={`business-${establishment._id}`}
            >
              <div className="dashboard-section-heading">
                <div>
                  <p className="eyebrow">
                    {establishment.city ?? "Local partner"} ·{" "}
                    {establishment.approvalStatus ?? "pending approval"}
                  </p>
                  <h2 id={`business-${establishment._id}`}>
                    {establishment.name ?? "Your establishment"}
                  </h2>
                </div>
                <span className="reservation-status">
                  {establishment.isActive ? "Active" : "Inactive"}
                </span>
              </div>

              {establishment.approvalStatus === "approved" &&
              establishment.isActive ? (
                <>
                  <div className="business-subsection-heading">
                    <h3>Your offers</h3>
                    <a href="http://localhost:3333/admin">
                      Edit full offer content in Sanity Studio
                    </a>
                  </div>
                  {establishment.offers?.length ? (
                    <div className="dashboard-list">
                      {establishment.offers.map((offer) => (
                        <article className="dashboard-card" key={offer._id}>
                          <div className="dashboard-card-heading">
                            <div>
                              <h3>{offer.name ?? "Unnamed offer"}</h3>
                              <p>
                                {typeof offer.quantityRemaining === "number"
                                  ? `${offer.quantityRemaining} available`
                                  : "Inventory unavailable"}
                                {typeof offer.discountedPriceAmd === "number"
                                  ? ` · ${formatAmd(offer.discountedPriceAmd)}`
                                  : ""}
                              </p>
                            </div>
                            <span className="reservation-status">
                              {offer.publicationStatus ?? "draft"}
                            </span>
                          </div>
                          <BusinessOfferEditor
                            offerId={offer._id}
                            originalPriceAmd={offer.originalPriceAmd}
                            discountedPriceAmd={offer.discountedPriceAmd}
                            quantity={offer.quantity}
                            publicationStatus={offer.publicationStatus}
                          />
                        </article>
                      ))}
                    </div>
                  ) : (
                    <p className="dashboard-empty">
                      No offers have been created for this establishment yet.
                      Create full offer content in the Studio.
                    </p>
                  )}
                </>
              ) : (
                <p className="dashboard-pending">
                  This establishment must be active and approved before its
                  offers can be managed here.
                </p>
              )}

              <div className="business-subsection-heading business-reservations-heading">
                <h3>Reservations</h3>
                <span>{establishment.reservations?.length ?? 0}</span>
              </div>
              {establishment.reservations?.length ? (
                <div className="dashboard-list">
                  {establishment.reservations.map((reservation) => (
                    <article className="dashboard-reservation-row" key={reservation._id}>
                      <div>
                        <h4>{reservation.offer?.name ?? "Food reservation"}</h4>
                        <p>
                          {reservation.customerEmail ?? "Customer"}
                          {reservation.pickupStart && reservation.pickupEnd
                            ? ` · ${formatPickupWindow(reservation.pickupStart, reservation.pickupEnd)}`
                            : ""}
                        </p>
                        <span className="reservation-status">
                          {reservation.status ?? "unknown"} ·{" "}
                          {reservation.quantity ?? 0} portions
                        </span>
                      </div>
                      {reservation.canMarkPickedUp ? (
                        <MarkPickedUpButton reservationId={reservation._id} />
                      ) : null}
                    </article>
                  ))}
                </div>
              ) : (
                <p className="dashboard-empty">No reservations yet.</p>
              )}
            </section>
          ))
        ) : (
          <EmptyState
            title="No business linked yet"
            description="Ask a FoodSave administrator to assign your Google account to an establishment. Your account code is shown below."
          />
        )}
        {!establishments?.length ? (
          <div className="business-account-code">
            <span>Your business account code</span>
            <code>{ownerHash}</code>
            <p>Share this code with an administrator to link your establishment.</p>
          </div>
        ) : null}
      </section>
      <Footer
        brandName={content.brandName}
        footerMessage={content.footerMessage}
        footerCredit={content.footerCredit}
      />
    </main>
  );
}
