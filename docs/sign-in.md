# Sign-up and sign-in for the public app

Owner decision, 13 October 2026: "yes to RevenueCat, you build sign-up". Claude builds customer accounts; RevenueCat handles store purchases later. The private test keeps Cloudflare Access ([owned hosting](cloudflare-hosting.md)). The public app uses email codes.

## How it works for people

1. They type their email address. Daywell emails a 6-digit code, with the subject "123456 is your Daywell code".
2. They type the code. Their first code creates the account; later codes sign them in on other devices.
3. They stay signed in for 90 days after they last used Daywell on that device. Signing out, or signing in to a different account on the same device, ends the session there.

There are no passwords to forget or leak. There is no Google or Facebook sign-in, because offering those would also require Sign in with Apple (App Review 4.8). Daywell sends codes rather than links, because a link opens the phone's browser instead of the app.

## Where it lives

| File | Job |
| --- | --- |
| `lib/public-access.ts` | The public front door. It handles the sign-in routes and adds the person's identity to each request only after their session cookie matches a live session. |
| `lib/email-sign-in.ts` | Codes, accounts, sessions, sign-in protection and the daily clean-up |
| `build/public-worker.ts` | The public app's Worker entry point |
| `drizzle/0006_email_sign_in.sql` | The `accounts`, `sign_in_codes` and `sessions` tables |
| `scripts/cloudflare-config.mjs` | A profile with `"signIn": "email"` builds the public app; see `cloudflare.public.example.json` |

The app itself doesn't change. It still reads the `oai-authenticated-user-id` and `oai-authenticated-user-email` headers, which only the front door can set. Account IDs look like `dw:` followed by 32 random hex characters.

| Route | What it does |
| --- | --- |
| `POST /api/sign-in/code` with `{ email }` | Emails a code |
| `POST /api/sign-in/verify` with `{ email, code }` | Signs the person in and sets the session cookie |
| `POST /api/sign-out`, or `GET /signout-with-chatgpt` from Daywell's own pages | Ends the session on this device, then shows the sign-in page saying they're signed out |
| `GET /signin-with-chatgpt?return_to=/eat` | Signed in: back to that page. Signed out: to the sign-in page, `/sign-in`. The app's existing sign-in links use this. |

The screens follow the preview approved on 13 October:
- `app/sign-in/` asks for the email, then the code. The code field accepts the phone's own code suggestions.
- A new account sees a welcome screen. Someone coming back returns to the page they were on.
- Settings shows "Your account", with the address and Sign out (`app/your-account.tsx`).
- `lib/sign-in-client.ts` turns the server's answers into the messages people see.

## Security

- **What is stored.** `accounts` keeps each address, so people can sign in again and see which account is open. Codes, and the addresses they were sent to, are stored only as hashes keyed with a server secret, so they can't be read back. Sessions are stored as hashes of the cookie's random token.
- **Codes** work for 10 minutes, for 5 tries and once only. A new code replaces the previous one.
- **Sign-in protection.** These are not usage limits, and normal use never meets them. They stop code guessing, and stop anyone using Daywell to send unwanted email, which would also harm whether its emails arrive.
  - Each address: 5 codes an hour, 10 a day, and 20 guesses a day across all its codes.
  - Each network (IP address, stored only as a keyed hash): 60 codes an hour.
  - Everyone together: 20,000 codes a day, a brake on runaway costs.
- **The cookie** is `__Host-daywell-session`: secure, HttpOnly, same-site Lax, for the whole app. While a session is in use it's renewed once a day.
- **Identity.** Identity headers sent by a browser are always removed. The session cookie never reaches the app.
- **Requests from other sites.** Sign-in requests must be same-site JSON. Another site can't sign someone out. Other sites can't show Daywell inside a frame.
- **Recordings.** `/audio-library/`, `/guided-audio/` and `/sleep-sounds/` need Daywell Plus. See [plans](plans.md).
- **Logs.** Nothing is logged: no addresses, codes or tokens.

## The App Review account

Apple's reviewers can't receive emailed codes (Apple 2.1). Set two Worker secrets: `DAYWELL_REVIEW_EMAIL`, an address on Daywell's domain, and `DAYWELL_REVIEW_CODE`, 6 random digits. That address then signs in with that code and is never emailed. The account holds no real data. Put the address and code in the review notes for both stores. Delete the secrets when no review is open; the normal guess limits apply meanwhile. A malformed code switches the review account off.

## Setting up the public app

The owner does the steps that need their accounts or payment; Claude prepares and checks the rest.

1. **Domain.** Choose and buy it with Cloudflare Registrar, so its DNS is already in Cloudflare.
2. **Database in the EU.** `npx wrangler d1 create daywell-db --jurisdiction eu`, and keep the returned database ID. This is a new, empty database. The private test's records stay where they are.
3. **Email.** Turn on Email Service sending, which is in open beta, for the domain with `npx wrangler email sending enable <domain>`. This adds its DNS records. New accounts start with a small daily sending quota, so ask Cloudflare for a higher limit before launch.
4. **Profile.** Copy `cloudflare.public.example.json` to `cloudflare.public.local.json`, which Git ignores, and fill it in. The sender is, for example, `sign-in@<domain>`.
5. **Build and check.** Run `npm run check`, then `npm run cloudflare:build -- cloudflare.public.local.json`. Inspect `dist/server/wrangler.json`, then apply the migrations with `npx wrangler d1 migrations apply DB --remote --config dist/server/wrangler.json`.
6. **Secret.** Create the server secret without anyone seeing it:
   ```sh
   node -e "process.stdout.write(require('node:crypto').randomBytes(32).toString('base64url'))" | npx wrangler secret put DAYWELL_AUTH_SECRET --config dist/server/wrangler.json
   ```
   Changing it later doesn't sign anyone out, but codes already sent stop working.
7. **Deploy** with `npx wrangler deploy --config dist/server/wrangler.json`. Then sign up with a real address on a phone, sign out, sign in again, and check that two accounts can't see each other's records.

## Setup checkpoint, 13 October 2026

- The owner registered **daywell.date** with Cloudflare Registrar. It renews in October 2027.
- **daywell-db** was created in the dashboard with the EU jurisdiction (region Eastern Europe). It is empty; the migrations run with the first deployment.
- Email Sending needs the Workers Paid plan ($5 a month plus usage, which includes email sending). The account is on Workers Free, so sending isn’t on yet.
- The real public profile (`daywell`, app at `https://daywell.date`, sender `sign-in@daywell.date`) is kept in the ignored `cloudflare.public.local.json` on the owner’s Windows machine. Its build and Wrangler dry-run pass. Nothing is deployed.
- Wrangler isn’t signed in on that machine. The public deployment needs these scopes: `account:read user:read workers:write workers_scripts:write workers_routes:write zone:read d1:write email_sending:write`.
- Next: Workers Paid (owner), Wrangler sign-in (owner approves), `wrangler email sending enable daywell.date`, migrations, `DAYWELL_AUTH_SECRET`, then deployment on the owner’s go-ahead, and a real sign-up test.

## Still to do

- Once the demo exists: a Back to the demo link on the sign-in page, and "Start Daywell" opening `/sign-in?start=1`, which uses the Start wording.
- Terms and privacy links under the form, once those pages exist.
- A demo for signed-out visitors.
- Plans and subscriptions (RevenueCat), including plan checks for recordings.
- Account closure ([#47](https://github.com/alisid0/daywell/pull/47)) must include the new tables: export the `accounts` row, and delete it at closure. Deleting it also removes the account's sessions. The sign-in protection counts aren't linked to an account and are removed within a day.
- The emails say "Daywell" until the app's name is settled.
