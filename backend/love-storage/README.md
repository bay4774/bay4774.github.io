# Encrypted love-journal storage

Dependency-free Cloudflare Worker API for the existing GitHub Pages frontend. R2 receives only validated AES-GCM envelopes. The access token is independent of the viewing password; the runtime stores its SHA-256 hash in the secret `LOVE_TOKEN_SHA256`. Requests never log credentials or content.

Deploy from the separate Sites checkout. Preserve its registered `.openai/hosting.json`, omit `static`, configure the `BUCKET` R2 binding, and run `node build.mjs`. Do not copy real secrets or the private source material into this directory. No D1 database or migration is needed.

`node --test backend/love-storage/tests/*.test.mjs` runs the API contract tests from the homepage repository. Within the service checkout use `npm test` and `npm run build`.

For local browser QA run `node backend/love-storage/dev.mjs`. It listens only on `127.0.0.1:4325`, derives the access-token hash from `.private/love/content.json`, and allows the frontend origin `http://127.0.0.1:4323`. Ciphertext preview records persist in `.qa/love-cloud-preview`; `LOVE_PREVIEW_DIRECTORY` and `LOVE_PREVIEW_PORT` can explicitly override those local defaults. The adapter maps incoming requests to internal HTTPS Request objects to exercise the unchanged production handler. `dev.mjs` is never included in the hosted build.

## API

Every `/api/*` request requires HTTPS and `Authorization: Bearer <access token>`. Browser requests allow `https://bay4774.github.io`; explicit preview origins may be added through comma-separated `ALLOWED_ORIGINS`. Requests without an Origin are permitted only after token authentication. CORS preflight never needs a token and validates the origin, method, and requested headers.

- `GET /api/entries?cursor=...`: metadata only, up to 100 items per page; use the returned cursor until it is null.
- `GET /api/entries/<UUID>`: encrypted JSON envelope and its `ETag` header.
- `PUT /api/entries/<UUID>?type=photo|diary|anniversary`: encrypted JSON; create using `If-None-Match: *`, update using the previous `If-Match` ETag. Both writes use R2's atomic condition, and conflicts return HTTP 409. Types are immutable. Response metadata includes the quoted ETag and original server-generated creation timestamp.
- `GET /health`: `{ "ok": true }` only.

Every envelope has exactly `version`, `kdf`, `iterations`, `cipher`, `salt`, `iv`, and `ciphertext`, matching the shared browser crypto module. Body size is capped at 6 MiB while reading, even without Content-Length. There is no delete endpoint; archival can be represented inside a newly encrypted payload.

R2 conditional writes use the documented `onlyIf: Headers` interface; metadata listing uses `include: ['customMetadata']` and the returned `truncated` flag. [Cloudflare Workers R2 API reference](https://developers.cloudflare.com/r2/api/workers/workers-api-reference/).
