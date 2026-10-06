# Working across two machines

**Owner's standing instruction, 6 October 2026:** GitHub must be the ultimate source of truth at the end of every development session, on both machines. The local preview is only a preview.

Canonical repository: **https://github.com/alisid0/daywell**.

## What is authoritative

| Material | Role |
| --- | --- |
| GitHub `main` | Integrated project baseline after review and passing checks |
| Named GitHub feature branch and pull request | Shared work in progress, including the latest handover |
| Local checkout and localhost preview | Temporary workspace for the checked-out branch and commit |
| Chat, screenshots and recordings of a preview | Context and evidence; never a replacement for published source and assets |

A feature can be saved on GitHub without being merged into `main`. Always make that distinction in the session summary. A push also does not deploy the app.

## Beginning a session on either machine

1. Inspect the current branch, remote URL, working tree and any unpushed commits. Fetch `origin` and read the relevant open pull request and handover.
2. Continue the feature branch named in the handover when resuming that feature. For a new change, create a separate branch from current `origin/main`. Do not assume the most recently opened browser tab identifies the right version.
3. Fast-forward a clean local branch to its intended GitHub branch. If local work or divergent commits exist, preserve them and reconcile deliberately. Never overwrite work just to make a preview look current.
4. If the lockfile changed, use `npm run install:ci`. Apply documented database migrations with the existing setup workflow when needed, preserving local records. Start or restart the preview from the updated checkout.
5. When presenting the preview, identify its branch and commit. If local edits are being demonstrated, say that they are not yet published.

## Ending a session on either machine

1. Review changed and untracked files. Stage only intended source, documentation and required public assets. Keep credentials, private data and runtime state out of Git.
2. Run the relevant checks and record the results. App changes use `npm run check` and the scoped lint gate from README. Documentation-only changes need a diff and link review; GitHub checks still apply before a merge.
3. Commit and push the session's work to its GitHub branch. Complete work goes into a normal PR; incomplete or failing work goes into a clearly labelled draft PR with its limitations. Do not misrepresent a failing checkpoint as release-ready.
4. Update the PR description or a handover document committed on that branch. Record the change, tests, missing verification and next steps using the template below. Do not require access to a particular chat or machine to continue.
5. Fetch and compare `HEAD` with the published remote branch. They must match before saying that this machine is synced. Check the worktree as well and disclose any deliberately remaining local work.
6. Give the owner the GitHub branch or PR link, the pushed commit, check results and next step. Distinguish local checks from GitHub checks; if GitHub checks are pending, missing or failing, say so and leave the PR unmerged. After an authorised merge with passing checks, update clean local checkouts from GitHub before the next preview.

When ending a session with no changes, verify the branch state and report that there was nothing new to publish. Never create an empty commit just to satisfy this workflow.

## Handover template

Put this information in the PR description or a dated file under `docs/handover/`. The PR's current head identifies the latest pushed commit; include its SHA in the final session message.

```text
Session date:
Branch and PR:
What changed:
Checks performed and their results:
What is not yet verified:
Remaining work / next step:
Setup or migration steps needed on the other machine:
Any work still local, and why:
```

## Concurrent work, interruptions and failures

- Prefer separate branches for separate changes. If both machines continue one branch, fetch before editing and immediately before pushing; reconcile newer remote commits and rerun affected checks. Never force-push over the other machine's work.
- If a push fails or GitHub cannot be reached, retain the local commit and say that GitHub has **not** yet received it. Provide the branch and commit needed to recover and publish it next session. Do not claim the session is fully handed over.
- Never reset, clean, delete local records, discard commits or automatically stash edits to make sync succeed. Resolve ordinary conflicts while preserving both contributors' intended changes; ask only when the intended result is unclear.
- Automatic background sync can fetch and fast-forward a clean, idle checkout. It is not an automatic publisher of unfinished edits and does not merge pull requests. The active coding session owns the end-of-session commit, push and handover.
- GitHub carries project code and approved public assets. Each machine keeps its own ignored credentials, browser preferences and local database records; do not upload those to make the machines identical.

The root [AGENTS.md](../AGENTS.md) and [CLAUDE.md](../CLAUDE.md) point all coding assistants to this same workflow. It must be followed on each machine; a note in one chat or an automation running on only one computer cannot enforce the other machine's behaviour.
