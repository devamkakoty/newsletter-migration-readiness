import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const html = await readFile(new URL("./index.html", import.meta.url), "utf8");

test("project offer has a concrete price and deliverables", () => {
  assert.match(html, /US\$350 migration-readiness milestone/);
  assert.match(html, /risk register/);
  assert.match(html, /cutover checklist/);
  assert.match(html, /rollback plan/);
  assert.match(html, /one revision/);
});

test("project inquiry uses the owned repository template", () => {
  assert.match(
    html,
    /https:\/\/github\.com\/devamkakoty\/newsletter-migration-readiness\/issues\/new\?template=newsletter-migration-project\.yml/,
  );
});

test("public inquiry warns against confidential data", () => {
  assert.match(html, /GitHub issues are public/);
  assert.match(html, /Do not include subscriber\s+data, credentials, exports or other confidential information/);
});
