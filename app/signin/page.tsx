import { redirect } from "next/navigation";
import { CredentialsForm } from "../components/auth/CredentialsForm";
import { Header } from "../components/layout/Header";
import { getAuthSession, hasAuthConfiguration } from "../lib/auth";
import { getHomePageContent } from "../lib/home-page";

type SignInPageProps = {
  searchParams: Promise<{ callbackUrl?: string | string[] }>;
};

function safeCallbackUrl(value: string | string[] | undefined) {
  const candidate = Array.isArray(value) ? value[0] : value;
  if (
    candidate?.startsWith("/") &&
    !candidate.startsWith("//") &&
    !candidate.includes("\\")
  ) {
    return candidate;
  }

  return "/profile";
}

export default async function SignInPage({ searchParams }: SignInPageProps) {
  const [session, content, params] = await Promise.all([
    getAuthSession(),
    getHomePageContent(),
    searchParams,
  ]);
  const callbackUrl = safeCallbackUrl(params.callbackUrl);

  if (session?.user?.id) {
    redirect(callbackUrl);
  }

  return (
    <main>
      <Header
        brandName={content.brandName}
        navigationLabel={content.navigationLabel}
      />
      <section className="auth-page" aria-labelledby="signin-title">
        <p className="eyebrow">A seat at the good-food table</p>
        <h1 id="signin-title">Welcome to FoodSave.</h1>
        <p>
          Sign in to keep track of your rescued finds and manage your
          reservations.
        </p>
        {hasAuthConfiguration() ? (
          <CredentialsForm callbackUrl={callbackUrl} mode="signin" />
        ) : (
          <p className="auth-configuration-message" role="status">
            Sign-in is not configured yet. Set the session secret and account
            encryption key.
          </p>
        )}
      </section>
    </main>
  );
}
