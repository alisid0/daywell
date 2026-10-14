import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { parsePlan, type Plan } from "@/lib/plans";

export type ChatGPTUser = {
  userId: string;
  displayName: string;
  email: string;
  fullName: string | null;
  // Set by the hosting's front door (docs/plans.md).
  plan: Plan;
};

const USER_ID_HEADER = "oai-authenticated-user-id";
const USER_EMAIL_HEADER = "oai-authenticated-user-email";
const USER_FULL_NAME_HEADER = "oai-authenticated-user-full-name";
const USER_PLAN_HEADER = "oai-authenticated-user-plan";
const USER_FULL_NAME_ENCODING_HEADER =
  "oai-authenticated-user-full-name-encoding";
const PERCENT_ENCODED_UTF8 = "percent-encoded-utf-8";
const SIGN_IN_PATH = "/signin-with-chatgpt";
const SIGN_OUT_PATH = "/signout-with-chatgpt";
const CALLBACK_PATH = "/callback";

export async function getChatGPTUser(): Promise<ChatGPTUser | null> {
  const requestHeaders = await headers();
  const userId = requestHeaders.get(USER_ID_HEADER);
  const email = requestHeaders.get(USER_EMAIL_HEADER);
  if (!userId || !email) return null;

  const encodedFullName = requestHeaders.get(USER_FULL_NAME_HEADER);
  const fullName =
    encodedFullName &&
    requestHeaders.get(USER_FULL_NAME_ENCODING_HEADER) === PERCENT_ENCODED_UTF8
      ? safeDecodeURIComponent(encodedFullName)
      : null;

  // The local preview has no subscriptions, so it gets every feature. Hosted, a missing plan means none.
  const plan = parsePlan(requestHeaders.get(USER_PLAN_HEADER)) ?? (import.meta.env.DEV ? "plus" : "none");

  return {
    userId,
    displayName: fullName ?? email,
    email,
    fullName,
    plan,
  };
}

// Daywell itself needs a plan (paid-only, owner decision, 12 October 2026). Without one, people choose a plan first.
export async function requirePlanUser(returnTo: string): Promise<ChatGPTUser> {
  const user = await requireChatGPTUser(returnTo);
  if (user.plan === "none") redirect(`/plans?return_to=${encodeURIComponent(safeRelativeReturnPath(returnTo))}`);
  return user;
}

export async function requireChatGPTUser(
  returnTo: string,
): Promise<ChatGPTUser> {
  const user = await getChatGPTUser();
  if (user) return user;

  redirect(chatGPTSignInPath(returnTo));
}

export function chatGPTSignInPath(returnTo: string): string {
  const safeReturnTo = safeRelativeReturnPath(returnTo);
  return `${SIGN_IN_PATH}?return_to=${encodeURIComponent(safeReturnTo)}`;
}

export function chatGPTSignOutPath(returnTo = "/"): string {
  const safeReturnTo = safeRelativeReturnPath(returnTo);
  return `${SIGN_OUT_PATH}?return_to=${encodeURIComponent(safeReturnTo)}`;
}

// What the settings panel shows about the signed-in account. Accounts from email sign-in (docs/sign-in.md)
// have `dw:` IDs; the private test signs in through Cloudflare Access instead.
export type Account = { email: string; emailSignIn: boolean; plan: Plan };
export function accountOf(user: ChatGPTUser): Account {
  return { email: user.email, emailSignIn: user.userId.startsWith("dw:"), plan: user.plan };
}

export function safeRelativeReturnPath(value: string): string {
  if (!value.startsWith("/") || value.startsWith("//")) return "/";

  let url: URL;
  try {
    url = new URL(value, "https://app.local");
  } catch {
    return "/";
  }
  if (url.origin !== "https://app.local") return "/";
  if (isReservedAuthPath(url.pathname)) return "/";

  return `${url.pathname}${url.search}${url.hash}`;
}

function isReservedAuthPath(pathname: string): boolean {
  return (
    pathname === SIGN_IN_PATH ||
    pathname === SIGN_OUT_PATH ||
    pathname === CALLBACK_PATH ||
    pathname === "/sign-in" ||
    pathname.startsWith("/api/")
  );
}

function safeDecodeURIComponent(value: string): string | null {
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}
