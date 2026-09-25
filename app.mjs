import { QUESTIONS, evaluateMigration, toMarkdown } from "./audit.mjs";

const form = document.querySelector("#audit-form");
const resultBox = document.querySelector("#result");
const actionsBox = document.querySelector("#actions");
const blockerBox = document.querySelector("#blockers");
const scoreBox = document.querySelector("#score");
const completionBox = document.querySelector("#completion");
const statusBox = document.querySelector("#status");
const downloadButton = document.querySelector("#download");
const resetButton = document.querySelector("#reset");

let currentResult = evaluateMigration();

function option(value, label) {
  const element = document.createElement("option");
  element.value = value;
  element.textContent = label;
  return element;
}

function renderQuestions() {
  let currentSection = "";
  for (const question of QUESTIONS) {
    if (question.section !== currentSection) {
      currentSection = question.section;
      const heading = document.createElement("h2");
      heading.textContent = currentSection;
      form.append(heading);
    }
    const row = document.createElement("label");
    row.className = "question";
    const prompt = document.createElement("span");
    prompt.textContent = question.label;
    const select = document.createElement("select");
    select.name = question.id;
    select.setAttribute("aria-label", question.label);
    select.required = true;
    select.append(
      option("", "Choose…"),
      option("yes", "Ready"),
      option("partial", "Partly / uncertain"),
      option("no", "Not ready")
    );
    row.append(prompt, select);
    form.append(row);
  }
}

function collectAnswers() {
  return Object.fromEntries(new FormData(form).entries());
}

function list(items, emptyText, format) {
  const ul = document.createElement("ul");
  if (!items.length) {
    const li = document.createElement("li");
    li.textContent = emptyText;
    ul.append(li);
  } else {
    for (const item of items) {
      const li = document.createElement("li");
      li.textContent = format(item);
      ul.append(li);
    }
  }
  return ul;
}

function renderResult() {
  currentResult = evaluateMigration(collectAnswers());
  scoreBox.textContent = `${currentResult.score}/100`;
  completionBox.textContent = `${currentResult.answered}/${currentResult.totalQuestions}`;
  statusBox.textContent = currentResult.status;
  blockerBox.replaceChildren(
    list(currentResult.blockers, "No explicit hard blocker selected.", (item) => item.reason)
  );
  actionsBox.replaceChildren(
    list(currentResult.actions, "Run a representative pilot and verify the result.", (item) => `${item.priority}: ${item.text}`)
  );
  resultBox.hidden = false;
  downloadButton.disabled = false;
  resultBox.scrollIntoView({ behavior: "smooth", block: "start" });
}

function downloadReport() {
  const blob = new Blob([toMarkdown(currentResult)], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "newsletter-migration-readiness.md";
  anchor.click();
  URL.revokeObjectURL(url);
}

renderQuestions();
form.addEventListener("submit", (event) => {
  event.preventDefault();
  renderResult();
});
form.addEventListener("change", () => {
  if (!resultBox.hidden) {
    resultBox.hidden = true;
    downloadButton.disabled = true;
    currentResult = evaluateMigration();
  }
});
downloadButton.addEventListener("click", downloadReport);
resetButton.addEventListener("click", () => {
  form.reset();
  resultBox.hidden = true;
  downloadButton.disabled = true;
  currentResult = evaluateMigration();
});
