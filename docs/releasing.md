# Releasing `@jiggai/recipes`

This repo publishes to npm as:

```text
@jiggai/recipes
```

This is the practical release guide.

---

## Before you release

Make sure these are true:
- `package.json` version is correct
- `openclaw.plugin.json` version matches
- tests pass
- the branch/PR you intend to release is actually the one merged to `main`

Useful checks:

```bash
npm test
npm view @jiggai/recipes version
node -p "require('./package.json').version"
cat openclaw.plugin.json
```

---

## Recommended release flow

From `main`:

```bash
git checkout main
git pull --ff-only
npm version patch
```

Or use `minor` / `major` when appropriate:

```bash
npm version minor
npm version major
```

Then push commit + tag:

```bash
git push origin main --follow-tags
```

GitHub Actions will run the normal publish workflow.

---

## Manual local publish

If you are intentionally publishing from your local machine:

```bash
npm ci
npm run lint
npm test
npm publish
```

You will need local npm auth:

```bash
npm whoami
```

---

## Verify after publishing

Check the published version:

```bash
npm view @jiggai/recipes version
```

Then test a fresh install or upgrade path:

```bash
openclaw plugins install @jiggai/recipes
openclaw gateway restart
openclaw recipes list
```

---

## Important note about local patches

If you maintain a local controller-specific patch (for example, workflow posting behavior), publishing a clean package does **not** mean that patch is part of the public release unless you intentionally merged it.

So after publishing, you may need to:
- reapply your local patch
- relink/reinstall the plugin
- tell your assistant to turn the local posting path back on

If you use a patch file or gist for that workflow, keep it handy as part of your release checklist.

---

## About canary publishes

If canary publishing is paused in the repo workflow config, PR activity will not automatically publish canary builds.

That is separate from the normal release workflow.

---

## Minimum safe release checklist

```bash
# sync to main
git checkout main
git pull --ff-only

# run checks
npm test

# bump version
npm version patch

# push
git push origin main --follow-tags

# verify published version
npm view @jiggai/recipes version
```
