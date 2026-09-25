export const QUESTIONS = Object.freeze([
  {
    id: "ownership",
    section: "Rights and audience",
    label: "Can you document your right to email every subscriber?",
    weight: 8,
    blocker: "Do not migrate contacts without a documented permission basis.",
    actions: {
      partial: "Separate contacts with unclear permission before any import.",
      no: "Establish a lawful permission basis or remove those contacts."
    }
  },
  {
    id: "subscribers",
    section: "Rights and audience",
    label: "Can the current platform export all active subscribers with stable identifiers?",
    weight: 12,
    blocker: "A complete, attributable subscriber export is required.",
    actions: {
      partial: "Reconcile subscriber counts and identifier coverage across exports.",
      no: "Obtain a complete subscriber export before choosing a cutover date."
    }
  },
  {
    id: "suppressions",
    section: "Rights and audience",
    label: "Can you export unsubscribes, complaints, bounces and suppression history?",
    weight: 10,
    blocker: "Suppression history must be preserved to avoid mailing opted-out contacts.",
    actions: {
      partial: "Merge and deduplicate every available suppression source.",
      no: "Recover suppression history before importing active contacts."
    }
  },
  {
    id: "consent",
    section: "Rights and audience",
    label: "Are consent source, timestamp and applicable notice retained where required?",
    weight: 8,
    blocker: "Required consent evidence is missing.",
    actions: {
      partial: "Map missing consent fields and define which contacts must be excluded.",
      no: "Do not import affected contacts without the required consent evidence."
    }
  },
  {
    id: "segments",
    section: "Audience model",
    label: "Have tags, segments, custom fields and scoring rules been inventoried?",
    weight: 7,
    actions: {
      partial: "Create a field-and-segment mapping table with sample counts.",
      no: "Inventory audience fields and rules before configuring the destination."
    }
  },
  {
    id: "automations",
    section: "Audience model",
    label: "Have automation triggers, delays, branches and exit rules been documented?",
    weight: 8,
    actions: {
      partial: "Document every live automation path and its entry/exit conditions.",
      no: "Create an automation inventory before migration."
    }
  },
  {
    id: "forms",
    section: "Acquisition",
    label: "Are forms, landing pages, lead magnets and confirmation flows inventoried?",
    weight: 7,
    actions: {
      partial: "List each acquisition surface and its destination fields or automation.",
      no: "Inventory every live signup path before switching."
    }
  },
  {
    id: "domain",
    section: "Delivery",
    label: "Do you control the sending domain, DNS and required website records?",
    weight: 7,
    blocker: "Cutover cannot be controlled without access to required domain records.",
    actions: {
      partial: "Confirm who can approve and change every required domain record.",
      no: "Secure authorized domain administration before migration."
    }
  },
  {
    id: "authentication",
    section: "Delivery",
    label: "Are current sending authentication records and ownership documented?",
    weight: 9,
    actions: {
      partial: "Record the current authentication state and a reviewed change plan.",
      no: "Document and review sending authentication before cutover."
    }
  },
  {
    id: "paid",
    section: "Revenue",
    label: "Are paid subscriptions, entitlements, refunds and cancellation flows mapped?",
    weight: 8,
    actions: {
      partial: "Reconcile paid-member entitlements and exception handling.",
      no: "Map revenue and entitlement flows before migrating paid members."
    }
  },
  {
    id: "integrations",
    section: "Connected systems",
    label: "Have integrations, API keys, webhooks and data owners been inventoried?",
    weight: 5,
    actions: {
      partial: "Create an integration register with owner, direction and failure mode.",
      no: "Inventory connected systems before retiring the current platform."
    }
  },
  {
    id: "analytics",
    section: "Connected systems",
    label: "Have reporting definitions and historical exports been preserved?",
    weight: 4,
    actions: {
      partial: "Define which metrics must remain comparable after migration.",
      no: "Export required history and document metric definitions."
    }
  },
  {
    id: "parallel",
    section: "Cutover",
    label: "Can representative flows be tested without mailing the full audience?",
    weight: 4,
    actions: {
      partial: "Define a small internal test cohort and non-production test cases.",
      no: "Create a safe test path before any audience-wide cutover."
    }
  },
  {
    id: "rollback",
    section: "Cutover",
    label: "Is there a documented rollback owner, trigger and preserved source state?",
    weight: 3,
    actions: {
      partial: "Name the rollback decision owner and objective trigger.",
      no: "Preserve source state and define rollback before cutover."
    }
  }
]);

export const ANSWERS = Object.freeze({
  yes: { factor: 1, label: "Ready" },
  partial: { factor: 0.5, label: "Partial" },
  no: { factor: 0, label: "Missing" }
});

const MAX_SCORE = QUESTIONS.reduce((sum, question) => sum + question.weight, 0);

function normalizeAnswers(answers = {}) {
  return Object.fromEntries(
    QUESTIONS.map(({ id }) => [id, Object.hasOwn(ANSWERS, answers[id]) ? answers[id] : ""])
  );
}

function riskFor(score, complete, blockers) {
  if (blockers.length) return "Blocked";
  if (!complete) return "Incomplete";
  if (score >= 80) return "Ready for a controlled pilot";
  if (score >= 60) return "Preparation required";
  if (score >= 40) return "High migration risk";
  return "Not ready";
}

export function evaluateMigration(inputAnswers = {}) {
  const answers = normalizeAnswers(inputAnswers);
  const answered = QUESTIONS.filter(({ id }) => answers[id]).length;
  const points = QUESTIONS.reduce((sum, question) => {
    const answer = ANSWERS[answers[question.id]];
    return sum + (answer ? question.weight * answer.factor : 0);
  }, 0);
  const score = Math.round((points / MAX_SCORE) * 100);
  const blockers = QUESTIONS
    .filter((question) => question.blocker && answers[question.id] && answers[question.id] !== "yes")
    .map((question) => ({ id: question.id, label: question.label, reason: question.blocker }));
  const actions = QUESTIONS
    .filter((question) => answers[question.id] !== "yes")
    .map((question) => {
      const answer = answers[question.id];
      return {
        id: question.id,
        section: question.section,
        priority: answer && answer !== "yes" && question.blocker ? "Blocker" : answer ? "Action" : "Unanswered",
        text: answer ? question.actions[answer] : `Answer: ${question.label}`
      };
    })
    .sort(
      (a, b) =>
        ({ Blocker: 0, Unanswered: 1, Action: 2 }[a.priority] -
          { Blocker: 0, Unanswered: 1, Action: 2 }[b.priority])
    );
  const complete = answered === QUESTIONS.length;
  return {
    schema: "newsletter-migration-readiness/1",
    score,
    maximumScore: 100,
    answered,
    totalQuestions: QUESTIONS.length,
    complete,
    status: riskFor(score, complete, blockers),
    blockers,
    actions,
    answers
  };
}

export function toMarkdown(result) {
  const lines = [
    "# Newsletter Migration Readiness Audit",
    "",
    `- Status: **${result.status}**`,
    `- Readiness score: **${result.score}/100**`,
    `- Questions answered: **${result.answered}/${result.totalQuestions}**`,
    `- Hard blockers: **${result.blockers.length}**`,
    "",
    "## Required actions",
    ""
  ];
  if (!result.actions.length) {
    lines.push("- No gaps were identified by this questionnaire. Validate with a representative pilot before cutover.");
  } else {
    for (const action of result.actions) lines.push(`- **${action.priority} — ${action.section}:** ${action.text}`);
  }
  lines.push(
    "",
    "## Boundaries",
    "",
    "- This is a planning checklist, not legal, deliverability, security or platform-compatibility advice.",
    "- Verify exports, imports and representative message flows before retiring the source platform.",
    "- No questionnaire answer was transmitted or stored by the tool."
  );
  return lines.join("\n");
}
