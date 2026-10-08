# Your data feature proposal

**Status:** proposed launch requirements, published at the owner's request on 8 October 2026. This is not a claim that the controls are implemented, deployed or legally approved.

Daywell should let someone understand what it remembers, download their information and leave without friction. Keep the Cosy cove appearance, accessible controls and minimal typing. This proposal extends the implementation in [PR 34](https://github.com/alisid0/daywell/pull/34); it belongs alongside the [image upload policy](image-upload-policy.md), [safeguarding and data request requirements](safeguarding-and-data-requests.md), and [mobile release plan](mobile-release-plan.md).

## User experience

Settings links to **Your data**. The main host can open and explain this page when asked. Show the signed-in account so a person using a shared device can check whose information they are managing.

Opening copy: **Your data, your choice. See what Daywell remembers, download a copy or manage your account.**

| Control | Behaviour |
| --- | --- |
| What Daywell remembers | Explain account records, device-only data and provider processing separately. |
| Download my data | Prepare a private, readable copy and a structured export. |
| Privacy and AI choices | Explain photo and voice processing and expose only controls that actually work. Explain the effect of changing a choice on future processing and existing records. |
| Delete my account | A visible action below the ordinary controls, with a short review and explicit confirmation. |
| Privacy, Help and Manage subscription | Provide accessible links; show subscription management when billing exists. |

Voice may navigate and explain. Destructive confirmation must use an accessible explicit control, with fresh identity verification when needed. Do not require typing DELETE, giving a reason, downloading first or speaking to support. A mascot must not plead with a person to stay. Privacy controls are not a paid feature.

## Data inventory

Show only categories actually supported and saved. The implementation must discover all personal-data stores, not assume that the current database table list is the whole account.

| Category | Included information where held |
| --- | --- |
| Food | Meals, portions, calories consumed, sugar and other nutrition records, source and estimate labels. |
| Food basket | Ingredients, quantities, shopping, plans, purchases, cooking, leftovers, stock changes and undo history. |
| Move | Workouts, sets, activity and separately labelled estimated activity calories burned. |
| Relax and Sleep | Saved session history, sleep entries, notes and reflections. |
| Plans and history | Tasks, calendar entries and completed activities. |
| Preferences | Name, account settings and the supported device preferences. |
| Voice and AI | Purpose of processing, providers, retained conversation metadata/content where applicable, and available request routes. |
| Operations | Account identity links, usage, consent/choice records, support, billing and justified safety records, if introduced. |

Keep unknown nutrition values unknown. Do not convert missing sugar to zero or present an image estimate as a measurement. Food used, food consumed and activity calories burned remain distinct. The default proposal retains confirmed structured food records rather than a permanent original-photo gallery. Any future gallery needs a separate purpose, controls and retention decision.

Daywell remains general wellness: no diagnosis, clinical interpretation, mental-health treatment or improvement promises, medicine/supplement/alcohol recommendations, medical diets or compensatory exercise. This does not by itself determine the legal sensitivity of stored information or suitability for children.

## Download contract

Start with one download containing a readable report and JSON. CSV and scheduled exports can follow later. Include export time, timezone information where known, format version, categories, record counts, units, estimate/source labels and a manifest explaining exclusions.

Use a consistent database snapshot so inventory and its history agree. Include relevant historical/undo records. Label device-only drafts separately; do not silently upload them just to export them. Explain how to request provider-held data or other information outside the self-service export. Downloading a report is not necessarily the whole response to a statutory access request.

Require account authorisation and no-store responses. Avoid permanent export copies; any stored package needs a short, documented lifetime and account-scoped access. Exclude secrets and other users' data. Escape user content in the readable report, avoid executable content, and protect against spreadsheet formula injection if CSV is later added. Test download and native sharing on real Android and iPhone devices.

## Account deletion contract

Use **Review → Confirm identity if needed → Delete → Status receipt**. Offer an optional export without blocking deletion. Explain subscription implications and any applicable retention before confirmation.

1. Create a durable, idempotent deletion request and move the account into a state that rejects new writes and new AI/voice sessions.
2. Stop active conversations and pending saves. Invalidate Daywell sessions where supported and enforce the account state on every server write path; signing out one tab is insufficient.
3. Remove applicable account records transactionally, including food-operation history and undo snapshots. Coordinate narrowly justified legal holds as described in the companion procedure.
4. Clear this account's local drafts and preferences across the storage mechanisms used. Notify other tabs. Never delete a different person's data through a broad prefix match.
5. Schedule applicable provider cleanup with verified account-to-provider identifiers, retries and a durable status. External deletion calls cannot be part of the database transaction.
6. Show a receipt that distinguishes completed active-data removal, pending provider work and any justified retained information.

An offline device cannot be wiped immediately. On reconnection, reject its obsolete writes and clear old account data before it can upload again. Use a changed account/session generation or equivalent control so old recovery drafts cannot recreate a deleted account. Starting again requires a deliberate new-account flow.

| Outcome | Required response |
| --- | --- |
| Request rejected before acceptance | Explain that deletion could not start. |
| Connection lost after confirmation | Check the existing request's status; do not assert that nothing was removed. |
| Database work complete, provider work pending | Show both states and continue retrying safely. |
| Deletion finished with justified retention | Explain the remaining category, purpose and period where disclosure is lawful. |

Do not infer success from visiting `/account-deleted`. A receipt must be tied securely to an accepted request without revealing another account's status. Retain the minimum identifiers needed for pending work, restore protection or justified abuse prevention, with documented expiry. Such identifiers may still be personal data. Preserve shared aggregate usage correctly, without retaining a person's journal merely to enforce allowances.

## Providers and retention

| Store or service | Proposed requirement |
| --- | --- |
| Cloudflare D1 | Delete applicable active records, verify the actual backup plan and any extra exports, and reapply deletion records before restoring a backup into service. |
| ElevenLabs | Prefer no saved voice recordings and the shortest justified transcript retention, after verification. Associate conversation IDs securely with their account and orchestrate applicable deletions. |
| OpenAI | Map each endpoint and the information sent. Use appropriate storage controls; do not promise zero retention from `store: false` alone. |
| Browser speech recognition | Explain the actual browser/vendor processing; do not call it wholly on-device without evidence. |
| Identity provider | Revoke Daywell access where supported. Deleting Daywell does not delete someone's Google or Apple account. |
| Billing and support | Explain any continuing subscription and justified retained records separately. Do not claim cancellation until confirmed. |

ElevenLabs supports separate transcript/audio retention and conversation deletion. A zero-day setting is a valid configured value, not a missing setting; verify the actual deletion timing. See [retention settings](https://elevenlabs.io/docs/eleven-agents/customization/privacy/retention) and [conversation deletion](https://elevenlabs.io/docs/eleven-agents/api-reference/conversations/delete).

Cloudflare documents D1 recovery windows of seven days on Free and thirty on Paid; additional exports can differ. Verify Daywell's configuration before promising a period. See [D1 backups](https://developers.cloudflare.com/d1/reference/time-travel/). OpenAI's endpoint-specific retention and image-safety exceptions must be reflected in our wording; see [OpenAI data controls](https://developers.openai.com/api/docs/guides/your-data).

## Existing implementation and remaining work

Source baseline: PR 34 at `61f302e51dc214f8adf967ec94269d8efdf943bc`, reviewed 8 October 2026. Later implementations must update this checkpoint rather than silently treating the following work as complete.

| Existing foundation | Remaining work |
| --- | --- |
| [Account store](../db/account-store.ts) exports five user-keyed tables | Bound the “everything” claim; inventory non-database stores and provide a consistent snapshot and readable package. |
| Database deletion uses a batch transaction | Add account lifecycle controls, session/write barriers, durable provider work and legal-hold handling. |
| [Account HTTP handler](../lib/account-http.ts) checks identity, origin and confirmation | Add reliable retry/status handling and appropriate fresh authentication. |
| [Your data UI](../app/account/your-data.tsx) provides confirmation and local cleanup | Replace broad localStorage-prefix clearing with account-scoped cleanup; handle lost responses honestly. |
| [Deleted page](../app/account-deleted/page.tsx) displays static success | Require verified status and replace unverified backup promises. |
| [Owner details](../app/owner-details.tsx) contain placeholders | Supply verified controller/contact details; represent unset retention separately from zero. |
| Privacy and support pages exist | Verify actual provider, region, retention and tracking claims; provide public store-facing resources. |

The three owner placeholders are not the only launch blockers. Passing existing tests does not verify provider cleanup, stale-device behaviour or these policy controls.

## Release evidence and decisions

The owner must confirm operator/legal identity, monitored contact, audience and launch countries. Engineering must verify provider settings and public routes. A UK privacy adviser must assess lawful bases, sensitive information, children's access, retention and reporting scope. General-wellness branding does not settle whether information reveals health status; see [ICO special-category guidance](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/lawful-basis/special-category-data/what-is-special-category-data/).

Provide in-app deletion and the applicable external request resource. Keep public privacy/help/deletion information reachable without app installation while protecting actual account operations. See [Apple account deletion](https://developer.apple.com/help/app-review/guideline-reference/5-1-1-account-deletion) and [Google Play deletion](https://support.google.com/googleplay/android-developer/answer/13327111?hl=en). Support must handle requests outside the automated flow, including applicable deadlines and exceptions; see [ICO erasure guidance](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/individual-rights/individual-rights/right-to-erasure/).

Acceptance evidence must cover:

- [ ] User isolation, unauthenticated access, cross-origin requests and fresh-identity checks.
- [ ] Complete export counts and consistent food/history snapshots; unknown values, Unicode and unsafe report content.
- [ ] Duplicate deletion requests, lost responses, database rollback and verified receipts.
- [ ] Active voice, pending autosave, other tabs and offline devices cannot recreate records.
- [ ] Only verified provider conversations belonging to the account are deleted; failures remain pending and retry safely.
- [ ] Backup restoration reapplies deletions and respects narrowly scoped legal holds.
- [ ] Billing, identity-provider access and account deletion are represented accurately.
- [ ] Screen readers, large text, small screens and actual Android/iPhone download/deletion journeys.
- [ ] Image moderation and agency-request acceptance cases in the companion documents.

Delivery order: inventory and decisions; reliable deletion; readable export and public controls; hosted two-account and real-device verification. The earlier 6–10 focused engineering-day estimate was provisional for the data work alone. Scope the added moderation and safeguarding work separately; provider onboarding, legal review and device access can change the schedule. Do not advertise a guaranteed November approval.

Selective bulk deletion, scheduled exports and a detailed privacy activity dashboard are later iterations. Source references were checked on 8 October 2026 and must be rechecked before launch or a legal/provider change.
