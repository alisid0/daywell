# Account data and closure foundation

Implementation checkpoint: 12 October 2026, branch `codex/account-lifecycle`.
This integrates the PR #34 UI/proposals into current main and hardens the saved-data lifecycle. It is a draft release foundation, not a completed customer identity or whole-service deletion system.

## Implemented contract

- Your data offers a labelled HTML report and JSON, preserving record values, unknown nutrition, units and saved dates. Six queries run in one D1 batch so food state and its history represent one consistent snapshot. Exclusions are included in both formats.
- Closure requires a signed-in, same-origin request with an explicit action and request ID. The confirmation names the account and explains retained/external information.
- Migration `0004_account_closures.sql` adds a minimal closure receipt keyed to the trusted account identity. The receipt and deletion of the five personal tables commit in one transaction.
- Insert/update triggers on settings, entries, food_spaces, food_operations and usage_limits reject late saves for a closed identity, even if a request passed its API check just before closure.
- All personal and paid API routes check the barrier first. Closed identities get 410; inability to verify status fails closed. The account status, receipt and export endpoints remain available.
- Repeated closure requests return the original receipt. A failed or lost response says the result is uncertain and offers status checking/retry, never that nothing was removed.
- Server-rendered app pages redirect closed identities to their authenticated receipt. A receipt is never shown for an active account merely because someone opens its URL.
- Visible connected tabs check status every 30 seconds and on focus/reconnect. Matching storage events propagate closure between tabs. The account's food draft is removed, playback stop events are sent, and the app redirects. Offline drafts cannot be remotely erased while disconnected; the server rejects later saves.
- Device cleanup uses the exact current account scope. Other accounts' drafts and shared reading/appearance/voice preferences are preserved. A minimal local closure marker prevents stale draft recreation.

No new dependencies, paid provider calls, native builds or hosted changes are part of this checkpoint.

## Deployment order

Run the normal local `npm run setup` workflow on an existing checkout to add the migration without deleting records. For a separately authorised hosted release, apply the corresponding production D1 migration before serving these routes. Missing migration causes account checks to fail closed.

Do not remove a closure row to make a test or old login work again. Use a disposable, separate QA database. A future account recreation flow needs a new generation of account identity and explicit design.

Do not restore a backup over newer closure receipts: an operational restore must preserve/reapply all subsequent closure barriers before admitting traffic. The receipt retention, backup and restoration process is an unresolved launch gate, not an implemented operational guarantee.

## Verification

`npm run check` and `npm run lint:changed` are required.
Regression tests cover transaction rollback, isolation, canonical retry receipts, consistent exports, HTML escaping, closed-account write races/reassignment, API guard coverage and scoped device cleanup.

Use an isolated local preview with no provider credentials and a fresh disposable database:

```sh
node scripts/smoke-local.mjs http://localhost:5194 --allow-test-writes
node scripts/smoke-account.mjs http://localhost:5194 --allow-close-test-account
```

The second command permanently closes the synthetic local mock identity. It refuses non-loopback servers, the owner's port 5190, missing explicit flags and non-mock authentication. Do not use it on an everyday checkout on another port. Do not delete the receipt to rerun it.

Browser checks must also cover confirmation/cancel, exports, receipt navigation, reconnect and multiple accounts/devices. Local mock identity checks do not prove real hosted identity isolation or authentication freshness.

## Remaining public-release gates

1. Customer registration, sign-in/recovery, account-session revocation and a fresh verified identity challenge before destructive closure. Today's control trusts the existing private authenticated session.
2. Provider subject/conversation mapping and an auditable removal workflow, including failures, retries and truthful completion status. Existing signed voice URLs and in-flight provider sessions are not revoked by this change; server gating prevents new requests admitted after closure.
3. Approved operator/contact details, launch audience/countries, provider retention settings and accurate public privacy terms. `config/owner.json` intentionally has no invented contact or retention period.
4. A public deletion-information/request route outside the private Access gate, with secure ownership verification and a monitored support process. The new local `/delete-account` page alone does not meet that operational requirement.
5. Defined backup expiry, receipt retention, restoration controls, exceptional retention and response handling. Do not promise deletion from all backups/services based on this receipt.
6. Physical Android/iPhone and hosted two-account acceptance, including offline reconnect, session expiry, audio interruptions and inaccessible-account requests.

The policy documents remain proposals. They do not establish operational/legal readiness.
