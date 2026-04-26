## Fix AWS Amplify build — add `.npmrc` with `legacy-peer-deps`

### What's wrong

AWS Amplify runs `npm ci`, which strictly enforces peer-dependency rules. Our `package.json` has a mix of TipTap v2 and v3 packages (left over from incremental upgrades), and `npm` refuses to install them together. Bun (what Lovable uses) silently allows this, which is why the app builds fine here but fails on Amplify.

### The fix

Create a single file at the repo root:

**`.npmrc`**
```
legacy-peer-deps=true
```

That's the entire file. It tells `npm` (and `npm ci`) to use the older, more lenient peer-dependency resolution — the same behaviour Bun uses by default. No code changes, no version bumps, no risk to the running app.

### Why this is safe

- It only changes how `npm` *resolves* dependencies during install — it does not change which versions get installed (those are pinned in `package-lock.json`).
- It's a widely-used, officially-supported npm flag — not a hack.
- The Lovable preview is unaffected (Bun doesn't read `.npmrc` peer-dep settings the same way and is already lenient).
- It's reversible — delete the file any time.

### What happens next

1. I create `.npmrc` with that one line.
2. Lovable syncs to your GitHub repo automatically.
3. AWS Amplify's next build picks it up and `npm ci` succeeds.

### Follow-up (separate piece of work, when you have time)

The underlying TipTap v2/v3 mix should still get cleaned up properly — ideally aligning everything to v3. That's a separate job that needs QA on every editor in the app (email templates, trainer notes, signatures, etc.). Not urgent now that the build will work, but worth doing eventually so we're not relying on the lenient flag forever. Happy to plan that as its own task whenever you want.