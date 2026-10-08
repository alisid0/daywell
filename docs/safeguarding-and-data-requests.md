# Safeguarding and investigation data request requirements

**Status:** proposed operating requirements, 8 October 2026. UK launch assumptions require qualified legal review. This public repository contains the general procedure only; it must never contain real case files, evidence, personal records, requester details, credentials or private operational contacts.

This extends [Your data](your-data-proposal.md) and the [image upload policy](image-upload-policy.md). An online or offline investigation does not automatically entitle someone to a Daywell account. Preservation, disclosure, account restriction and emergency response are separate decisions. The main AI host must not make those decisions or send records to an agency.

## Request thresholds

| Situation | Required approach |
| --- | --- |
| Informal allegation or “send everything” request | Do not disclose automatically. Verify requester, purpose, authority and precise scope. |
| Valid binding court order or statutory demand | Validate jurisdiction and legal effect; comply with lawful scope and seek clarification or challenge overbreadth as appropriate. |
| Non-compulsory law-enforcement request | Assess necessity, proportionality and lawful basis individually; a police request is not automatically compulsory. |
| Credible immediate danger to life | Use an expedited, documented emergency assessment with verified responders and the applicable lawful basis. Do not represent ordinary distress as an emergency disclosure trigger. |
| Private investigator, employer, insurer or family member | Their request alone does not establish an entitlement to account records. Assess any independent valid authority separately. |
| Foreign authority or intelligence service | Refer for specialist review of the applicable regime, jurisdiction, legal process and any international transfer before disclosure. |

No charge, arrest or conviction is necessarily required for a lawful disclosure; none automatically authorises full-account access either. UK GDPR requires a lawful basis and, where relevant, additional conditions for health-related or criminal-offence data. The crime-and-taxation exemption is not blanket permission. See [ICO law-enforcement sharing](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/data-sharing/sharing-personal-data-with-law-enforcement-authorities/).

## Intake and decision record

Appoint a responsible privacy/safety contact, a trained backup and an external legal escalation route before launch. Actual contact details and access arrangements belong in a restricted operational runbook. Do not promise continuous human monitoring without staffing it.

1. Receive the request through a controlled channel. Independently verify identity using official contact information, rather than trusting a display name, supplied phone number or letterhead.
2. Obtain the legal authority, purpose, relevant account identifiers, date range, requested records and deadline. Verify any urgency or restriction on notification separately.
3. Assess legal basis, sensitive-data conditions, necessity, scope and secure delivery. Escalate unclear, broad, foreign or contested requests. Ask for clarification when appropriate.
4. Prepare only authorised records. Check account matching and redact unrelated information. Preserve labels distinguishing user statements and estimates from established facts.
5. Require a recorded approval by the designated authorised person, with a second check where practicable. Use a time-limited secure delivery method, not a public export URL or ordinary app login.
6. Record decision, approver, authority, scope, recipient, delivery and review/deletion dates in the restricted register. Log refusals and narrowed requests too.

The [ICO request assessment tool](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/data-sharing/can-i-share-personal-data-with-a-law-enforcement-authority/) supports necessity, secure sharing and a documented decision. It is not suitable for slowing an urgent emergency response. Our proposed process provides no standing agency dashboard or general database access; any exceptional legally compelled access needs separate handling.

## Emergency and safeguarding response

Respond to credible urgent danger through verified emergency channels with only necessary information and appropriate authority. The vital-interests basis is narrow; sensitive information has additional conditions, so do not treat concern or a user's refusal as a universal override. See [ICO vital interests](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/lawful-basis/a-guide-to-lawful-basis/vital-interests/).

For a credible illegal-content concern, stop ordinary access and processing, restrict handling to trained authorised personnel, and follow the applicable specialist reporting/preservation procedure. Do not ask general support staff to download, forward or repeatedly inspect suspected abuse material. Do not acquire extra material to investigate. A classifier result is a signal, not proof of a person's guilt. Consider that a submitter may be a victim or reporter.

Prepare the appropriate reporting route before an incident. The NCA's industry portal applies to in-scope user-to-user providers; it is not for every crime or every business. Determine Daywell's actual scope, any reporting deadlines and retention requirements with counsel. Avoid duplicate referrals where the relevant reporting guidance says so; document the applicable route and acknowledgement securely. See [NCA CSEA reporting](https://www.nationalcrimeagency.gov.uk/what-we-do/crime-threats/child-sexual-abuse-and-exploitation/the-child-sexual-exploitation-abuse-industry-reporting-portal) and [Ofcom scope guidance](https://www.ofcom.org.uk/online-safety/illegal-and-harmful-content/ai-chatbots-and-online-regulation-what-you-need-to-know).

Provider action does not establish that Daywell has made a report. Explain provider safety-processing exceptions in the privacy notice; see [OpenAI child-safety guidance](https://developers.openai.com/api/docs/guides/csam-guidance) and [data controls](https://developers.openai.com/api/docs/guides/your-data).

## Preservation and account deletion

A legal hold means narrowly preserving identified information under a documented legal requirement or other assessed lawful justification. Receiving an allegation must not automatically freeze an entire account forever. A preservation request is not itself permission to disclose.

The implementation must support a hold reference, legal justification, precise record/time scope, authorised approver, restricted storage location, review/expiry conditions and release decision. Keep this metadata and evidence outside public GitHub. Preserve integrity and access history when handling evidence. Do not make unnecessary copies.

Coordinate holds with deletion jobs and backup restoration. Remove unrelated records normally when appropriate; prevent preserved information from being reused for meal suggestions, analytics, training or ordinary support. Review expiry and remove the retained material when no longer justified, subject to the applicable procedure. Never destroy records subject to a valid preservation obligation to fulfil an unconditional app deletion promise.

Conversely, do not collect or retain extra meals, photographs, locations or conversations merely in case a future investigation needs them. Keep an accurate record of whether requested information was ever held or has already been removed under normal retention; do not fabricate unavailable data.

Erasure exceptions and backup handling require case-specific assessment; see [ICO erasure guidance](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/individual-rights/individual-rights/right-to-erasure/).

## User information

The published privacy notice should explain bounded legal, safety and disclosure exceptions without promising absolute confidentiality or immediate erasure everywhere. Notify people about disclosures where lawful; delay only under a valid restriction or an applicable documented exemption, and review the reason for delay. An investigation alone does not establish a blanket secrecy rule. See [ICO transparency and exemptions](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/data-sharing/sharing-personal-data-with-law-enforcement-authorities/).

Customer-facing copy must not imply continuous emergency monitoring or that the host can call authorities. Use neutral image refusals and a clear route to report an incorrect decision. Safeguarding is separate from offering clinical advice: Daywell still cannot diagnose, assess symptoms or recommend medicines, supplements or alcohol.

## Launch verification

- [ ] Legal scope, relevant countries and reporting routes reviewed; responsible people and backup named privately.
- [ ] Simulated impersonation, overly broad requests and incorrect-account matching are rejected or narrowed.
- [ ] A valid narrow request produces only the authorised period/categories, with secure approval and delivery records.
- [ ] Emergency handling does not depend on a slow routine support queue or unchecked AI disclosure.
- [ ] Preservation alone does not trigger disclosure; hold expiry, deletion and backup restore are exercised together.
- [ ] User-notification restrictions are documented and reviewed rather than applied globally.
- [ ] Provider reports and Daywell reports are distinguished, and no secrets or evidence enter source control.
- [ ] Access is restricted and audited; a dry run uses fictional records without contacting real agencies.

This procedure is a launch design, not legal sign-off. References were checked on 8 October 2026; recheck changing guidance before publication and when an actual request requires advice.
