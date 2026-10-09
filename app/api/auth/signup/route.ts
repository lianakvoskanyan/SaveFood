import { z } from "zod";
import { createLocalAccount } from "../../../lib/auth/accounts";
import { hasSanityWriteConfiguration } from "../../../lib/auth";
import { isEmailBlocked } from "../../../lib/auth/access";

const signupSchema = z
  .object({
    username: z
      .string()
      .trim()
      .min(3)
      .max(32)
      .regex(/^[a-zA-Z0-9_]+$/, "Use only letters, numbers, and underscores."),
    email: z.string().trim().email().max(254),
    password: z.string().min(10).max(128),
  })
  .strict();

function isSanityConflict(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "statusCode" in error &&
    error.statusCode === 409
  );
}

export async function POST(request: Request) {
  if (!hasSanityWriteConfiguration()) {
    return Response.json(
      { message: "Sign-up is unavailable until server-side account settings are configured." },
      { status: 503 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ message: "Request body must be valid JSON." }, { status: 400 });
  }

  const parsed = signupSchema.safeParse(body);
  if (!parsed.success) {
    return Response.json(
      {
        message:
          "Enter a username (3–32 letters, numbers, or underscores), a valid email, and a password of at least 10 characters.",
      },
      { status: 400 },
    );
  }

  const email = parsed.data.email.toLocaleLowerCase();
  if (await isEmailBlocked(email)) {
    return Response.json(
      { message: "This account is unavailable. Contact FoodSave support." },
      { status: 403 },
    );
  }

  try {
    const created = await createLocalAccount({...parsed.data, email});
    if (created === "username") {
      return Response.json(
        {message: "That username is already taken. Please choose another."},
        {status: 409},
      );
    }
    if (created === "email") {
      return Response.json(
        {message: "An account with this email already exists. Please sign in."},
        {status: 409},
      );
    }
  } catch (error) {
    if (isSanityConflict(error)) {
      return Response.json(
        { message: "An account with this email already exists. Please sign in." },
        { status: 409 },
      );
    }
    throw error;
  }

  return Response.json({ message: "Account created." }, { status: 201 });
}
