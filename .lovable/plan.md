# Save "always regenerate package-lock.json" rule to project memory

## Problem
AWS Amplify builds run `npm ci` against the committed `package-lock.json`. When a dependency change is made without refreshing the lockfile, Amplify fails with a stale-lockfile error. This has happened across multiple apps.

## Change
Persist a **preference** memory so the rule is auto-injected into context on every future turn and applied whenever dependencies change.

### 1. New memory file: `mem://deployment/amplify-lockfile-rule`
- type: `preference`
- Body: After any `package.json` change (add/remove/version bump via `bun add`/`bun remove` or manual edit), run `npm install --legacy-peer-deps` to regenerate `package-lock.json` and commit it alongside `package.json`. Amplify uses `npm ci` against the committed lockfile; a stale lockfile fails the build. The project uses `legacy-peer-deps=true` (`.npmrc`). Applies to all AWS-Amplify-hosted apps.

### 2. Update `mem://index.md`
Add a Core line (applies to every dependency-touching action):
> **Deployment**: Regenerate `package-lock.json` on any dependency change (Amplify runs `npm ci`; stale lockfile fails builds). Use `npm install --legacy-peer-deps`.

Add a Memories entry:
> - [Amplify Lockfile Rule](mem://deployment/amplify-lockfile-rule) — Refresh package-lock.json on every dependency change for Amplify builds

## Notes
- No source code changes. This is a memory-only update.
- Once saved, the rule is enforced automatically in future sessions without re-prompting.
