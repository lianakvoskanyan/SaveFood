import { redirect } from "next/navigation";
import {
  AdminEstablishmentControls,
  AdminOfferControls,
  AdminUserAccessControl,
} from "../components/dashboards/AdminControls";
import { Footer } from "../components/layout/Footer";
import { Header } from "../components/layout/Header";
import { getAuthSession } from "../lib/auth";
import {
  getUserEmailHash,
  getUserIdentityHash,
  isAdminEmail,
} from "../lib/auth/access";
import { getHomePageContent } from "../lib/home-page";
import { sanityClient } from "../lib/sanity/client";
import {
  ADMIN_ESTABLISHMENTS_QUERY,
  ADMIN_OFFERS_QUERY,
  ADMIN_RESERVATION_ACCOUNTS_QUERY,
  APP_SETTINGS_QUERY,
} from "../lib/sanity/queries";

const queryOptions = {
  next: { revalidate: 0 },
  perspective: "published" as const,
};

export default async function AdminDashboardPage() {
  const session = await getAuthSession();
  if (!session?.user?.id || !session.user.email) {
    redirect("/signin?callbackUrl=%2Fadmin-dashboard");
  }
  if (!isAdminEmail(session.user.email)) {
    redirect("/profile");
  }

  const [content, establishments, offers, reservationAccounts, settings] =
    await Promise.all([
      getHomePageContent(),
      sanityClient.fetch(ADMIN_ESTABLISHMENTS_QUERY, {}, queryOptions),
      sanityClient.fetch(ADMIN_OFFERS_QUERY, {}, queryOptions),
      sanityClient.fetch(ADMIN_RESERVATION_ACCOUNTS_QUERY, {}, queryOptions),
      sanityClient.fetch(APP_SETTINGS_QUERY, {}, queryOptions),
    ]);

  const accounts = new Map<
    string,
    { hash: string; email: string; reservationCount: number; isBusiness: boolean }
  >();

  for (const reservation of reservationAccounts ?? []) {
    if (!reservation.customerId) continue;
    const hash = getUserIdentityHash(reservation.customerId);
    const account = accounts.get(hash) ?? {
      hash,
      email: reservation.customerEmail ?? "Google account",
      reservationCount: 0,
      isBusiness: false,
    };
    account.reservationCount += 1;
    if (reservation.customerEmail) account.email = reservation.customerEmail;
    accounts.set(hash, account);
  }

  for (const establishment of establishments ?? []) {
    if (!establishment.ownerUserId) continue;
    const account = accounts.get(establishment.ownerUserId) ?? {
      hash: establishment.ownerUserId,
      email: "Business account",
      reservationCount: 0,
      isBusiness: true,
    };
    account.isBusiness = true;
    accounts.set(establishment.ownerUserId, account);
  }

  const blockedHashes = new Set(settings?.blockedUserHashes ?? []);
  const blockedEmailHashes = new Set(settings?.blockedEmailHashes ?? []);
  const users = [...accounts.values()].sort((left, right) =>
    left.email.localeCompare(right.email),
  );

  return (
    <main>
      <Header
        brandName={content.brandName}
        navigationLabel={content.navigationLabel}
      />
      <section className="dashboard-page" aria-labelledby="admin-title">
        <div className="dashboard-heading">
          <div>
            <p className="eyebrow">FoodSave operations</p>
            <h1 id="admin-title">Admin dashboard</h1>
            <p>Review local partners, offers, and account access.</p>
          </div>
          <span className="dashboard-role">Administrator</span>
        </div>

        <section className="dashboard-section" aria-labelledby="admin-businesses">
          <div className="dashboard-section-heading">
            <div>
              <p className="eyebrow">Partner network</p>
              <h2 id="admin-businesses">Establishments</h2>
            </div>
            <span>{establishments?.length ?? 0}</span>
          </div>
          {establishments?.length ? (
            <div className="dashboard-list">
              {establishments.map((establishment) => (
                <article className="dashboard-card" key={establishment._id}>
                  <div className="dashboard-card-heading">
                    <div>
                      <h3>{establishment.name ?? "Unnamed establishment"}</h3>
                      <p>{establishment.city ?? "Location not set"}</p>
                    </div>
                    <span
                      className={`reservation-status status-${establishment.approvalStatus ?? "pending"}`}
                    >
                      {establishment.approvalStatus ?? "pending"}
                    </span>
                  </div>
                  <AdminEstablishmentControls
                    id={establishment._id}
                    approvalStatus={establishment.approvalStatus}
                    isActive={establishment.isActive}
                    ownerUserId={establishment.ownerUserId}
                    users={users.map(({ hash, email }) => ({ hash, email }))}
                  />
                </article>
              ))}
            </div>
          ) : (
            <p className="dashboard-empty">No establishments have been added yet.</p>
          )}
        </section>

        <section className="dashboard-section" aria-labelledby="admin-offers">
          <div className="dashboard-section-heading">
            <div>
              <p className="eyebrow">Marketplace inventory</p>
              <h2 id="admin-offers">Food offers</h2>
            </div>
            <span>{offers?.length ?? 0}</span>
          </div>
          {offers?.length ? (
            <div className="dashboard-list">
              {offers.map((offer) => (
                <article className="dashboard-card" key={offer._id}>
                  <div className="dashboard-card-heading">
                    <div>
                      <h3>{offer.name ?? "Unnamed offer"}</h3>
                      <p>
                        {[offer.establishment?.name, offer.establishment?.city]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>
                    <span>
                      {typeof offer.quantityRemaining === "number"
                        ? `${offer.quantityRemaining} left`
                        : "Stock unknown"}
                    </span>
                  </div>
                  <AdminOfferControls
                    id={offer._id}
                    publicationStatus={offer.publicationStatus}
                  />
                </article>
              ))}
            </div>
          ) : (
            <p className="dashboard-empty">No food offers have been added yet.</p>
          )}
        </section>

        <section className="dashboard-section" aria-labelledby="admin-users">
          <div className="dashboard-section-heading">
            <div>
              <p className="eyebrow">Marketplace accounts</p>
              <h2 id="admin-users">Users</h2>
            </div>
            <span>{users.length}</span>
          </div>
          {users.length ? (
            <div className="dashboard-list">
              {users.map((user) => {
                const blocked =
                  blockedHashes.has(user.hash) ||
                  blockedEmailHashes.has(getUserEmailHash(user.email));

                return (
                  <article className="dashboard-user-row" key={user.hash}>
                    <div>
                      <h3>{user.email}</h3>
                      <p>
                        {user.isBusiness ? "Business account" : "Customer"}
                        {user.reservationCount
                          ? ` · ${user.reservationCount} reservation${user.reservationCount === 1 ? "" : "s"}`
                          : ""}
                      </p>
                    </div>
                    <div className="dashboard-user-actions">
                      <span
                        className={`reservation-status ${blocked ? "status-cancelled" : ""}`}
                      >
                        {blocked ? "Blocked" : "Active"}
                      </span>
                      <AdminUserAccessControl
                        userHash={user.hash}
                        email={user.email}
                        blocked={blocked}
                      />
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <p className="dashboard-empty">
              Accounts appear here when they have a reservation or are assigned
              to a business.
            </p>
          )}
        </section>
      </section>
      <Footer
        brandName={content.brandName}
        footerMessage={content.footerMessage}
        footerCredit={content.footerCredit}
      />
    </main>
  );
}
