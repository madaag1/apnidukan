# Apni Dukan collaboration and data safety

This repository is shared by `madaag1` and `Gurtan7`. The GitHub repository is the source of truth for code. Firestore is the source of truth for live store data.

## Git workflow

- `main` is the protected production branch. Do not work directly on it.
- `madaag1` uses branches named `madaag1/<short-task>`.
- `Gurtan7` uses branches named `gurtan7/<short-task>`.
- Before starting work, update local `main`:

  ```powershell
  git switch main
  git pull --ff-only origin main
  git switch -c gurtan7/<short-task>
  ```

  Replace `gurtan7` with `madaag1` when appropriate.
- Keep each commit focused and descriptive. Never commit passwords, Firebase service-account keys, exports containing customer data, or local `.firebase` output.
- Push the feature branch and open a pull request. The other user reviews it before it is merged into `main`.
- Do not force-push shared branches. If a merge conflict occurs, stop and resolve it locally with both users aware of the affected files.
- After a pull request is merged, delete the feature branch and start the next task from a fresh `main`.

## GitHub settings for `madaag1`

Enable these repository settings once:

1. Protect `main` under **Settings -> Branches**.
2. Require a pull request before merging.
3. Require one approval from the other collaborator.
4. Require the branch to be up to date before merging.
5. Disable force pushes and branch deletion for `main`.
6. Give both users the lowest repository permissions that allow their work. Keep administrator and billing permissions with the owner.

## Firestore data safety

- Code changes and database changes are separate. A Git revert does not restore Firestore documents.
- Only the production administrator should publish Firestore rules or modify production catalog/configuration data.
- Take a Firestore export before destructive data changes, rule changes, or production releases. Store exports outside this repository and restrict access because orders and customer information may be present.
- Keep at least daily backups for 30 days and verify that a recent export exists before a release.
- Never put a Firestore export, customer data, passwords, or service-account JSON in Git.
- Test rule changes against a staging Firebase project before publishing them to production.

The exact Firebase project, authentication setup, and rules are documented in `FIREBASE_SETUP.md`.

## Emergency recovery

1. Stop writes if live data is at risk.
2. Record the time, affected collection, and the last known good backup.
3. Revert the code through a pull request if the problem is in the website.
4. Restore Firestore from the most recent verified export if the problem is in live data.
5. Do not overwrite the only backup while investigating.
