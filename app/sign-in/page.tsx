import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getChatGPTUser, safeRelativeReturnPath } from "../chatgpt-auth";
import SignIn from "./sign-in";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Sign in · Daywell" };

// The public app's sign-in page (docs/sign-in.md). Someone already signed in goes straight back.
export default async function SignInPage({ searchParams }: { searchParams: Promise<{ return_to?: string | string[]; signed_out?: string; start?: string }> }) {
  const query = await searchParams;
  const returnTo = safeRelativeReturnPath(typeof query.return_to === "string" ? query.return_to : "/");
  if (await getChatGPTUser()) redirect(returnTo);
  return <SignIn returnTo={returnTo} signedOut={query.signed_out === "1"} starting={query.start === "1"} />;
}
