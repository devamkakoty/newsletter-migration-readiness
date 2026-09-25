# Newsletter Migration Readiness Audit

A zero-dependency, browser-only checklist that turns migration unknowns into a
prioritized report. It is an original owned utility and a **local product
experiment**, not an accepted affiliate application, referral, sale, earnings
claim or recommendation of a particular provider.

## Run and test

Requires Node.js22 or newer. No installation is needed.

```powershell
npm test
$env:PORT=0; npm run serve
```

The server binds to loopback only. The page has no remote scripts, images,
fonts, analytics, persistence or outbound application calls. Answers remain
in page memory; a Markdown report is generated only when the user requests a
download.

## Product boundary

The audit checks audience rights and exports, suppression history, consent,
segments, automations, forms, domain control, authentication, paid-member
flows, integrations, analytics, testability and rollback. It does not inspect
an account or uploaded export, prove deliverability, provide legal advice, or
guarantee compatibility with a destination platform.

No affiliate link is present. Any future referral relationship must be
approved through the applicable programme, use its permitted link and claims,
and display a clear material-connection disclosure near the recommendation.
The tool must remain useful when the user does not click or buy.

## Stop/go test

Proceed beyond the local experiment only if:

1. all deterministic tests pass;
2. the rendered page makes no outbound application request and stores no answers;
3. a fresh user can produce an actionable report in under ten minutes;
4. at least one real distribution channel permits the workflow;
5. programme approval and receiving terms are established before a referral
   link is added.

Otherwise, keep the artifact as portfolio evidence and do not add features in
the hope that distribution will appear.

## Public version

The public page, when enabled, is expected at:

`https://devamkakoty.github.io/newsletter-migration-readiness/`

The hosted version may create ordinary web-server request logs for loading the
page and its files. Questionnaire answers remain in the page and are not sent
by the application.
