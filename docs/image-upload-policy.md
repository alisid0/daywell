# Draft image upload policy

**Status:** proposed product rules and implementation requirements, 8 October 2026. Not yet deployed or approved as customer-facing legal terms. Part of the [Your data proposal](your-data-proposal.md).

Daywell's food camera accepts pictures to help with meals, ingredients and shopping. It is not a general image analyser, body-assessment service or medical service. People select the image to send; Daywell must not scan their photo library. Movement remains a guided training partner without a workout-camera requirement.

## Image decisions

| Image | Proposed behaviour |
| --- | --- |
| Meals, ingredients, nutrition labels, packaging, menus and food receipts | Accept for the selected food task. For receipts, extract relevant food information and avoid retaining payment/address details. |
| Blurry, unreadable or uncertain food | Offer a retake or spoken description. Never fabricate quantities, nutrition or sugar values. |
| Unrelated but otherwise harmless image | Explain the food scope and offer a retake. No account penalty for an accidental upload. |
| Body photographs, injuries or medical documents | Decline body/medical interpretation neutrally; redirect to the food workflow. This does not make the image criminal. |
| Pornography, explicit sexual imagery or graphic violence | Stop normal analysis and saving; provide a brief neutral refusal. |
| Suspected child sexual abuse or exploitation, or another credible illegal-content concern | Stop normal processing and invoke the restricted safeguarding procedure, including applicable reporting and preservation. A model flag alone is not a legal finding. |

An incidental person behind a meal is not automatically a reason to reject it. Do not infer age, identity, guilt or health from appearance. Context matters: nonsexual nudity is not automatically sexual abuse, and a user may be reporting abuse or seeking help. Do not punish a victim because a classifier flags their submission. Do not ask them to upload further harmful material as proof.

Suggested irrelevant-image copy: **Show me your meal, ingredients, menu or food label. You can also tell me what you have.**

Suggested blocked-image copy: **This image can't be used in Daywell. Please choose a food photo or describe your meal.**

These messages must not reveal suspected content, label the person a criminal or claim that authorities have been contacted when they have not.

## Processing sequence

**User chooses image → file validation and content safety checks → food relevance → food analysis → user review → confirmed record.**

Enforce checks on the server as well as in the interface. Authenticate uploads, limit file sizes and decoded dimensions, verify actual media types, and use a safe image decoder. Reject malformed or unsupported files. Do not allow a client flag or instructions embedded in an image to bypass checks or authorise actions.

Use transient, non-public handling for ordinary captures. Remove unnecessary location metadata before routine third-party food processing. Do not write raw images/base64 requests into logs, crash reports or analytics. Once a credible safeguarding case exists, evidence handling follows the separate procedure; routine cleanup must not destroy records subject to an applicable preservation duty.

If a safety service fails, pause image analysis and offer another supported input route. Voice/text require their own safeguards; they are not a way to bypass safety checks. Do not repeatedly send a rejected image to different general-purpose models hoping one accepts it.

Use appropriately supported moderation and specialist child-safety detection with expert response procedures. General moderation is not sufficient on its own. OpenAI documents that its `sexual/minors` moderation category is text-only and is not a substitute for dedicated CSAM detection. See [moderation capabilities](https://developers.openai.com/api/docs/guides/moderation) and [developer child-safety guidance](https://developers.openai.com/api/docs/guides/csam-guidance).

No detection system guarantees that every harmful image is found or every innocent image passes. Retain only justified, time-limited safety metadata for ordinary rejected requests. The restricted incident process determines handling of suspected illegal material. Do not automatically retain every rejected photograph for staff review or silently make a training dataset from uploads.

## Enforcement and user choices

Provide a way to report an incorrect block using a request reference and explanation, without requiring the rejected image to be emailed or reuploaded. Use trained, authorised review for serious cases. Repeated deliberate misuse may lead to proportionate rate restrictions or suspension; keep an appeal route. Do not invent an automatic three-strikes rule for suspected child exploitation or a permanent ban based solely on one uncertain classifier result.

Show camera/AI sharing information at the point of use. Offer crop/retake and optional typing. Persist only the confirmed structured food record by default; saved photos require a separately designed feature and retention choice. An adult-age checkbox does not prove age or remove the need to assess likely access by children.

## Retention and reporting boundaries

Do not promise that every rejected upload is instantly deleted by every provider. OpenAI states that image/file inputs flagged as potential CSAM are retained for manual review even under stricter data-retention controls. Reflect applicable exceptions in customer information. See [OpenAI image input retention](https://developers.openai.com/api/docs/guides/your-data).

Follow the [safeguarding and data request requirements](safeguarding-and-data-requests.md) for credible concerns. Do not put suspect images, real incident identifiers, victim details or reports in GitHub, ordinary support email, team chat or developer test fixtures. Provider reporting is not proof that Daywell has discharged every applicable duty of its own.

Before launch, determine the service's actual legal scope and reporting obligations. The NCA states that reporting obligations for in-scope user-to-user providers began on 7 April 2026; its industry portal is not a general reporting portal for every service. Private AI capture alone does not establish that Daywell is a regulated user-to-user service. See [NCA reporting guidance](https://www.nationalcrimeagency.gov.uk/what-we-do/crime-threats/child-sexual-abuse-and-exploitation/the-child-sexual-exploitation-abuse-industry-reporting-portal) and [Ofcom chatbot scope](https://www.ofcom.org.uk/online-safety/illegal-and-harmful-content/ai-chatbots-and-online-regulation-what-you-need-to-know).

## Acceptance evidence

- [ ] Ordinary food, labels, menus and receipts pass without requiring people to type their contents.
- [ ] Blurry and unrelated photos produce helpful recovery; incidental people do not cause blanket rejection.
- [ ] Explicit and graphic-content decisions cannot be bypassed through direct API calls, captions or embedded instructions.
- [ ] Safety-service outages do not continue image analysis unchecked.
- [ ] Metadata, raw payloads and rejected images are absent from ordinary logs, storage and public URLs.
- [ ] Reports and appeals reach a monitored, restricted process; serious actions are reviewable.
- [ ] General-wellness boundaries still apply to image and spoken requests.
- [ ] Provider retention/disclosure and legal reporting scope are verified before publication.

Use harmless synthetic fixtures and approved specialist test mechanisms. Never acquire, generate or put real illegal material into tests. Link evidence to the tested implementation commit. Documentation alone does not pass these checks.
