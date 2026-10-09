"use client";

import { useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type CredentialsFormProps = {
  callbackUrl: string;
  mode: "signin" | "signup";
};

export function CredentialsForm({ callbackUrl, mode }: CredentialsFormProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const isSignup = mode === "signup";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");

    const formData = new FormData(event.currentTarget);
    const login = String(formData.get("login") ?? "").trim().toLowerCase();
    const email = String(formData.get("email") ?? "").trim().toLowerCase();
    const password = String(formData.get("password") ?? "");
    const username = String(formData.get("username") ?? "").trim();

    try {
      if (isSignup) {
        const response = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, username }),
        });
        const payload: unknown = await response.json();
        if (!response.ok) {
          const message =
            typeof payload === "object" &&
            payload !== null &&
            "message" in payload &&
            typeof payload.message === "string"
              ? payload.message
              : "Could not create your account.";
          setError(message);
          setPending(false);
          return;
        }
      }

      const result = await signIn("credentials", {
        login: isSignup ? email : login,
        password,
        callbackUrl,
        redirect: false,
      });

      if (!result || result.error) {
        setError(
          isSignup
            ? "Your account was created, but sign-in could not be completed. Please sign in."
            : "Email or password is incorrect.",
        );
        setPending(false);
        return;
      }

      router.push(result.url ?? callbackUrl);
      router.refresh();
    } catch {
      setError("Could not reach the server. Please try again.");
      setPending(false);
    }
  }

  return (
    <div className="auth-signin-action">
      <form className="auth-form" onSubmit={handleSubmit}>
        {isSignup ? (
          <label className="form-field">
            <span>Username</span>
            <input
              autoComplete="username"
              maxLength={32}
              minLength={3}
              name="username"
              pattern="[A-Za-z0-9_]+"
              title="Use 3–32 letters, numbers, or underscores."
              required
              type="text"
            />
          </label>
        ) : null}
        <label className="form-field">
          <span>{isSignup ? "Email" : "Username or email"}</span>
          <input
            autoComplete={isSignup ? "email" : "username"}
            maxLength={254}
            name={isSignup ? "email" : "login"}
            required
            type={isSignup ? "email" : "text"}
          />
        </label>
        <label className="form-field">
          <span>Password</span>
          <input
            autoComplete={isSignup ? "new-password" : "current-password"}
            minLength={10}
            maxLength={128}
            name="password"
            required
            type="password"
          />
          {isSignup ? (
            <small>Use at least 10 characters.</small>
          ) : null}
        </label>
        <button
          className="primary-link"
          type="submit"
          disabled={pending}
        >
          {pending
            ? isSignup
              ? "Creating account..."
              : "Signing in..."
            : isSignup
              ? "Create account"
              : "Sign in"}
          <span aria-hidden="true">→</span>
        </button>
      </form>
      {error ? (
        <p className="form-message form-message-error" role="alert">
          {error}
        </p>
      ) : null}
      <p className="auth-switch">
        {isSignup ? "Already have an account?" : "New to FoodSave?"}{" "}
        <Link
          href={
            isSignup
              ? `/signin?callbackUrl=${encodeURIComponent(callbackUrl)}`
              : `/signup?callbackUrl=${encodeURIComponent(callbackUrl)}`
          }
        >
          {isSignup ? "Sign in" : "Create an account"}
        </Link>
      </p>
    </div>
  );
}
