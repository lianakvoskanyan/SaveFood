import { redirect } from "next/navigation";
import { CredentialsForm } from "../components/auth/CredentialsForm";
import { Header } from "../components/layout/Header";
import {
  getAuthSession,
  hasAuthConfiguration,
  hasSanityWriteConfiguration,
} from "../lib/auth";
import { getHomePageContent } from "../lib/home-page";

type SignUpPageProps = {
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

export default async function SignUpPage({ searchParams }: SignUpPageProps) {
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
      <section className="auth-page" aria-labelledby="signup-title">
        <p className="eyebrow">Join the FoodSave community</p>
        <h1 id="signup-title">Create your account.</h1>
        <p>
          Save your reservations and make good food go further.
        </p>
        {hasAuthConfiguration() && hasSanityWriteConfiguration() ? (
          <CredentialsForm callbackUrl={callbackUrl} mode="signup" />
        ) : (
          <p className="auth-configuration-message" role="status">
            Sign-up requires a server-side Sanity write token. It is configured
            by the site administrator and never entered by users.
          </p>
        )}
      </section>
    </main>
  );
}
