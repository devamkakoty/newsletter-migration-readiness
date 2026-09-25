import test from "node:test";
import assert from "node:assert/strict";
import { QUESTIONS, evaluateMigration, toMarkdown } from "./audit.mjs";

const all = (answer) => Object.fromEntries(QUESTIONS.map(({ id }) => [id, answer]));

test("weights total exactly 100", () => {
  assert.equal(QUESTIONS.reduce((sum, question) => sum + question.weight, 0), 100);
});

test("question identifiers are unique", () => {
  assert.equal(new Set(QUESTIONS.map(({ id }) => id)).size, QUESTIONS.length);
});

test("empty form is incomplete", () => {
  const result = evaluateMigration();
  assert.equal(result.status, "Incomplete");
  assert.equal(result.answered, 0);
  assert.equal(result.score, 0);
});

test("all ready answers score 100", () => {
  const result = evaluateMigration(all("yes"));
  assert.equal(result.score, 100);
  assert.equal(result.status, "Ready for a controlled pilot");
});

test("all partial answers score 50", () => {
  const result = evaluateMigration(all("partial"));
  assert.equal(result.score, 50);
  assert.equal(result.status, "Blocked");
});

test("all missing answers activate hard blockers", () => {
  const result = evaluateMigration(all("no"));
  assert.equal(result.status, "Blocked");
  assert.equal(result.blockers.length, 5);
});

test("unknown answer values are treated as unanswered", () => {
  const result = evaluateMigration({ ownership: "maybe" });
  assert.equal(result.answered, 0);
  assert.equal(result.answers.ownership, "");
});

test("extra input keys are discarded", () => {
  const result = evaluateMigration({ secret: "do-not-retain", ownership: "yes" });
  assert.equal(Object.hasOwn(result.answers, "secret"), false);
});

test("one explicit blocker overrides a high score", () => {
  const answers = all("yes");
  answers.consent = "no";
  const result = evaluateMigration(answers);
  assert.equal(result.status, "Blocked");
  assert.deepEqual(result.blockers.map(({ id }) => id), ["consent"]);
});

test("a partial hard-blocker field keeps the audit blocked", () => {
  const answers = all("yes");
  answers.suppressions = "partial";
  const result = evaluateMigration(answers);
  assert.equal(result.blockers.length, 1);
  assert.equal(result.status, "Blocked");
});

test("unanswered questions keep even a high score incomplete", () => {
  const answers = all("yes");
  delete answers.rollback;
  const result = evaluateMigration(answers);
  assert.equal(result.status, "Incomplete");
});

test("score rounds deterministically", () => {
  const result = evaluateMigration({ rollback: "partial" });
  assert.equal(result.score, 2);
});

test("ready threshold is inclusive at 80", () => {
  const answers = all("yes");
  for (const id of ["automations", "forms", "integrations"]) answers[id] = "no";
  const result = evaluateMigration(answers);
  assert.equal(result.score, 80);
  assert.equal(result.status, "Ready for a controlled pilot");
});

test("preparation band starts at 60", () => {
  const answers = all("no");
  for (const id of ["ownership", "subscribers", "suppressions", "consent", "domain"]) answers[id] = "yes";
  answers.segments = "yes";
  answers.automations = "yes";
  assert.equal(evaluateMigration(answers).status, "Preparation required");
});

test("a score of 45 remains in the high-risk band", () => {
  const answers = all("no");
  for (const id of ["ownership", "subscribers", "suppressions", "consent", "domain"]) answers[id] = "yes";
  assert.equal(evaluateMigration(answers).status, "High migration risk");
});

test("the lowest complete non-blocked score is 45", () => {
  const answers = all("no");
  for (const id of ["ownership", "subscribers", "suppressions", "consent", "domain"]) answers[id] = "yes";
  const result = evaluateMigration(answers);
  assert.equal(result.blockers.length, 0);
  assert.equal(result.score, 45);
  assert.equal(result.status, "High migration risk");
});

test("actions sort blockers before unanswered and ordinary actions", () => {
  const result = evaluateMigration({ ownership: "no", segments: "partial" });
  assert.equal(result.actions[0].priority, "Blocker");
  assert.equal(result.actions.at(-1).priority, "Action");
});

test("all-ready result retains a pilot validation action in Markdown", () => {
  assert.match(toMarkdown(evaluateMigration(all("yes"))), /representative pilot/i);
});

test("Markdown contains score and status", () => {
  const markdown = toMarkdown(evaluateMigration(all("partial")));
  assert.match(markdown, /50\/100/);
  assert.match(markdown, /Blocked/);
});

test("Markdown includes privacy boundary", () => {
  assert.match(toMarkdown(evaluateMigration()), /No questionnaire answer was transmitted or stored/);
});

test("evaluation does not mutate caller answers", () => {
  const answers = { ownership: "yes" };
  const snapshot = structuredClone(answers);
  evaluateMigration(answers);
  assert.deepEqual(answers, snapshot);
});

test("every non-ready answer has an action", () => {
  for (const question of QUESTIONS) {
    assert.ok(question.actions.partial);
    assert.ok(question.actions.no);
  }
});
