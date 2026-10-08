# Daywell: instructions for every machine and coding agent

Read [the shared session workflow](docs/github-workflow.md) before changing this repository.

Also read [the Android and iPhone release plan](docs/mobile-release-plan.md). The current objective is early-November store review on both platforms, not a standalone personal-APK demo. Confirm the working deadline and unresolved owner decisions, prioritise its launch scope, and keep release status tied to GitHub evidence. Do not represent target dates or passing web checks as store approval.

For account data, uploads or safety work, read the [Your data proposal](docs/your-data-proposal.md), [draft image upload policy](docs/image-upload-policy.md), and [safeguarding and data request requirements](docs/safeguarding-and-data-requests.md). These are proposed launch requirements, not implemented guarantees or legal sign-off. Preserve the owner's general-wellness and minimal-typing boundaries stated there. Keep real incident records, evidence and private operational details out of this public repository; do not automate agency disclosure through the AI host.

## GitHub is the source of truth

- The canonical repository is **https://github.com/alisid0/daywell**. This rule applies to both machines, Codex, Claude and other contributors.
- GitHub `main` is the integrated project baseline. An explicitly chosen GitHub feature branch and its pull request are the handover point for work still in progress.
- Local files, a running localhost preview, screenshots and chat history are working material. A successful preview does not mean the work is saved on GitHub or merged into `main`.

## Start every session

1. Check the remote, current branch, working tree and unpublished commits. Fetch GitHub before editing.
2. Read this file, the shared workflow, and the relevant GitHub pull request and handover. Continue the agreed feature branch, or start a new branch from current GitHub `main`.
3. Fast-forward a clean checkout to its intended remote branch. Preserve local work if it has diverged; reconcile it without destructive resets, forced pushes or automatic stashing.
4. Only then install changed dependencies as needed and start the preview. Identify its branch and commit when presenting it.

## Finish every session

1. Review the diff and run checks appropriate to the change. For app changes, use the checks in README and the PR template. Report failures and unverified behaviour honestly.
2. Commit the intended project changes and push the branch to GitHub. Do not leave the only copy of session work on one machine. Incomplete work belongs on a clearly labelled work-in-progress branch and draft PR with its failing checks and next steps recorded.
3. Create or update the pull request and its handover: what changed, checks performed, remaining work, branch and pushed commit. Follow existing review and merge requirements; publishing a branch does not authorise merging unrelated work.
4. Fetch again and verify the local commit matches the remote branch. Report the GitHub link, pushed commit and whether the work is on a branch, merged, or blocked. Never claim it is synced if the push was not verified.
5. If network access, permissions, conflicts or a user-requested early stop prevent publication, preserve the work and explicitly identify what remains local and how to resume. Do not hide the incomplete handover.

## Preserve private and local data

Never commit keys, `.dev.vars`, private `.env` files, personal records, local databases, dependencies, build output or tool caches. Review the staged diff instead of blindly staging everything. Source-code sync does not sync browser preferences, journal entries or credentials between machines.

Background sync may fetch and safely fast-forward a clean checkout. It must not publish unfinished work, force changes, merge PRs or overwrite edits. End-of-session publication is part of the active development session.
