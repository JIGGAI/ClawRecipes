# Releasing `@jiggai/recipes`

This repo is published to npm as `@jiggai/recipes`.

## Prereqs (one-time)

1) In GitHub repo settings, add an Actions secret:

- Name: `NPM_TOKEN`
- Value: an npm access token with publish rights for the `@jiggai` scope

2) Ensure `package.json` has the correct name/version and `publishConfig.access = "public"`.

## Release flow (recommended)

1) Update `package.json` version on `main` and commit it.

Typical:

- `npm version patch` (or `minor` / `major`)

This creates a commit and a git tag (by default `vX.Y.Z`).

2) Push the commit + tag:

- `git push origin main --follow-tags`

3) GitHub Actions will run the `Publish` workflow on tag push and publish to npm.

## Manual publish (local machine)

If you have npm auth configured locally (i.e. `npm whoami` works), you can publish directly:

- `npm ci`
- `npm run lint`
- `npm test`
- `npm publish`

## Verify

- `npm view @jiggai/recipes version`
- In a clean OpenClaw install, upgrade the extension and confirm the expected behavior is present.
