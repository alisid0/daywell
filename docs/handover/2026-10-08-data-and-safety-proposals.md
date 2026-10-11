# Data and safety proposal handover

**Session date:** 8 October 2026. **Branch:** `feature/your-data`. **Pull request:** [34](https://github.com/alisid0/daywell/pull/34).

The owner requested that the detailed data-feature proposal, image rules and investigation-access policy be published alongside the existing data feature. This checkpoint adds documentation and navigation only; it does not implement the proposed controls, change provider settings, delete data, deploy the app or merge a pull request.

## Documents

- [Your data proposal](../your-data-proposal.md): experience, export, reliable deletion, provider handling, current implementation gaps and acceptance evidence.
- [Draft image upload policy](../image-upload-policy.md): food scope, explicit/irrelevant images, safe processing, false positives, safeguarding escalation and tests.
- [Safeguarding and data requests](../safeguarding-and-data-requests.md): public procedure requirements, verified agency requests, emergencies, restricted evidence, legal holds and notification.

README, AGENTS and the mobile release plan link these requirements. The public repository contains no actual investigation records or operational access details. A restricted runbook and legal review are still needed.

## Validation and next steps

Documentation review passed: the intended diff was reviewed, whitespace checks passed, and all 36 relative links across the seven changed documents resolved. The source-backed provider and UK guidance references were reviewed on 8 October. This update adds no runtime changes, dependencies or migrations, so the app suite was not rerun locally. GitHub checks on the new PR head must be reported separately from the earlier implementation's passing checks; neither replaces legal review or real-device/provider verification.

First reconcile the verified data inventory, controller/contact details, provider retention and legal scope. Then implement the unchecked acceptance requirements. PR 34's earlier “fill three details then merge” handover is superseded by these additional launch gaps. The existing export covers server tables, and ElevenLabs deletion is an unimplemented integration rather than an unavailable provider capability.

The latest pushed checkpoint is the PR head. On the other machine fetch and continue `feature/your-data`, preserving local changes. No setup or migration is needed for this documentation update. The separate preview remains on its chosen food-development branch; publication does not change it.
