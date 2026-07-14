"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";

import { createClient } from "@/utils/supabase/server";

function field(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

function authRedirect(path: string, type: "error" | "message", value: string): never {
  const params = new URLSearchParams({ [type]: value });
  redirect(`${path}?${params.toString()}`);
}

export async function signInAction(formData: FormData) {
  const email = field(formData, "email").toLowerCase();
  const password = field(formData, "password");

  if (!email || !password) {
    authRedirect("/sign-in", "error", "Enter your email and password.");
  }

  const supabase = createClient(await cookies());
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    authRedirect("/sign-in", "error", "The email or password is incorrect.");
  }

  redirect("/app");
}

export async function signUpAction(formData: FormData) {
  const name = field(formData, "name");
  const email = field(formData, "email").toLowerCase();
  const password = field(formData, "password");

  if (!name || !email || password.length < 8) {
    authRedirect(
      "/sign-up",
      "error",
      "Enter your name, email, and a password of at least 8 characters.",
    );
  }

  const headerStore = await headers();
  const origin = headerStore.get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL;
  const supabase = createClient(await cookies());
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: name },
      emailRedirectTo: origin ? `${origin}/auth/callback?next=/app` : undefined,
    },
  });

  if (error) {
    authRedirect("/sign-up", "error", error.message);
  }

  if (data.session) {
    redirect("/app");
  }

  authRedirect(
    "/sign-in",
    "message",
    "Account created. Check your email to confirm your address, then sign in.",
  );
}

export async function forgotPasswordAction(formData: FormData) {
  const email = field(formData, "email").toLowerCase();

  if (!email) {
    authRedirect("/forgot-password", "error", "Enter your email address.");
  }

  const headerStore = await headers();
  const origin = headerStore.get("origin") ?? process.env.NEXT_PUBLIC_SITE_URL;
  const supabase = createClient(await cookies());
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: origin
      ? `${origin}/auth/callback?next=/update-password`
      : undefined,
  });

  if (error) {
    authRedirect("/forgot-password", "error", error.message);
  }

  authRedirect(
    "/sign-in",
    "message",
    "If that account exists, a password reset email has been sent.",
  );
}

export async function updatePasswordAction(formData: FormData) {
  const password = field(formData, "password");

  if (password.length < 8) {
    authRedirect(
      "/update-password",
      "error",
      "Use a password of at least 8 characters.",
    );
  }

  const supabase = createClient(await cookies());
  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    authRedirect("/update-password", "error", error.message);
  }

  authRedirect("/app", "message", "Your password has been updated.");
}

export async function signOutAction() {
  const supabase = createClient(await cookies());
  await supabase.auth.signOut();
  redirect("/sign-in");
}
