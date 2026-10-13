import type { Account } from "./chatgpt-auth";

// "Your account" in settings (approved sign-in preview, 13 October 2026). Signing out goes through the
// hosting's own front door: email sign-in ends the session; the private test signs out of Cloudflare Access.
export function YourAccount({ account }: { account: Account }) {
  return <section className="your-account" aria-labelledby="your-account-title">
    <h3 id="your-account-title">Your account</h3>
    <p>Signed in as <strong>{account.email}</strong></p>
    {account.emailSignIn && <small>You stay signed in on this device until you sign out, or after 90 days without opening Daywell.</small>}
    <a className="your-account-sign-out" href="/signout-with-chatgpt">Sign out</a>
  </section>;
}
