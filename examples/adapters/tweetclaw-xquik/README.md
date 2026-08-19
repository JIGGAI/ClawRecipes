# TweetClaw X Outbound Adapter

This loopback service implements ClawRecipes' `POST /v1/x/publish` contract.
It maps approved requests to Xquik's durable X write-action API.

Use it when a ClawRecipes workflow needs a direct X publishing backend. It
does not install platform credentials into workflow files.

## Safety Guarantees

- Binds to `127.0.0.1` by default.
- Authenticates every request with a separate adapter bearer key.
- Requires a payload-bound approval receipt by default.
- Forwards ClawRecipes' stable idempotency key to Xquik.
- Polls accepted writes until they reach a terminal state.
- Never resubmits a pending write with a new key.
- Accepts up to 4 public images or exactly 1 public video.
- Rejects redirects, oversized bodies, and malformed payloads.
- Does not include upstream error bodies in workflow errors.

## Configure

Set secrets outside workflow files:

```bash
export TWEETCLAW_ADAPTER_KEY='<random-local-service-key>'
export TWEETCLAW_APPROVAL_TOKEN='<approval-signing-secret>'
export XQUIK_API_KEY='<xquik-api-key>'
export XQUIK_X_ACCOUNT='@your-connected-account'
node examples/adapters/tweetclaw-xquik/server.mjs
```

The adapter defaults to `https://xquik.com/api/v1/` and port `8787`.

Configure ClawRecipes with the same local service key:

```json
{
  "outbound": {
    "baseUrl": "http://127.0.0.1:8787",
    "apiKey": "<random-local-service-key>"
  }
}
```

Do not place the Xquik API key or approval signing secret in a recipe.

## Workflow Request

Use `outbound.post` after a `human_approval` node. A trusted controller must
sign the exact account, text, media URLs, and idempotency key after approval.
It then injects the base64url HMAC-SHA256 receipt:

```json
{
  "tool": "outbound.post",
  "args": {
    "platform": "x",
    "text": "Approved post text",
    "media": [{ "url": "https://example.com/image.png", "type": "image" }],
    "idempotencyKey": "<workflowRunId>:publish_x",
    "approval": { "receipt": "<payload-bound-receipt>" }
  }
}
```

The adapter exports `createTweetClawApprovalReceipt` for trusted controller
code. Reusing a receipt with changed text, media, account, or idempotency key
fails validation. Never hardcode the receipt or signing secret.

```js
import { createTweetClawApprovalReceipt } from './server.mjs';

const receipt = createTweetClawApprovalReceipt({
  approvalToken: process.env.TWEETCLAW_APPROVAL_TOKEN,
  idempotencyKey: 'run-123:publish_x',
  requestBody: {
    account: '@your-connected-account',
    text: 'Approved post text',
    media: ['https://example.com/image.png'],
  },
});
```

Show the current Xquik write cost and the exact post payload before approval.

If the ClawRecipes host already enforces approval and only that trusted local
process can access the adapter key, you may set
`TWEETCLAW_REQUIRE_APPROVAL=false`. Review the workflow graph first.

Set `dryRun: true` to validate without approval or an Xquik request.

## Media

The current Xquik create-tweet contract accepts public media URLs directly.
The adapter therefore sends those URLs with the tweet instead of starting a
separate media write. This preserves one approval and one durable write.

Xquik is an independent third-party service. Not affiliated with X Corp.
"Twitter" and "X" are trademarks of X Corp.
