import assert from "node:assert/strict";
import crypto from "node:crypto";
import test from "node:test";
import {
  BIASES,
  GATES,
  PERSONAS,
  QUESTIONS,
  decodeSharedResult,
  encodeSharedResult,
  estimatePersonaShare,
  evaluateQuiz,
  personaShareCopy,
  selectQuestions,
  type Question,
  type Selection,
  type TradePath,
} from "../lib/domain.ts";

function selections(questions: Question[], answers: Array<"A" | "B" | "C">): Selection[] {
  return questions.map((question, index) => ({ questionId: question.id, optionId: answers[index] }));
}

test("the question bank contains two variants for every path and gate", () => {
  assert.equal(QUESTIONS.length, 30);
  for (const path of ["buy", "add", "sell"] as TradePath[]) {
    for (const gate of GATES) {
      assert.equal(
        QUESTIONS.filter((question) => question.path === path && question.gate === gate).length,
        2,
      );
    }
  }
});

test("every answer has a concise inner thought and relief line", () => {
  const options = QUESTIONS.flatMap((question) => question.options);
  assert.equal(options.length, 90);
  for (const answer of options) {
    assert.ok(answer.text.trim());
    assert.ok(answer.thought.trim());
    assert.ok(answer.relief.trim());
    assert.ok(answer.text.length <= 28, `answer copy is too long: ${answer.text}`);
    assert.ok(answer.thought.length <= 18, `inner thought is too long: ${answer.thought}`);
    assert.ok(answer.relief.length <= 12, `relief line is too long: ${answer.relief}`);
  }
});

test("the V1 score map remains unchanged after the copy rewrite", () => {
  const scoreMap = QUESTIONS.map((question) => [
    question.id,
    question.options.map((answer) => [answer.id, Object.entries(answer.scores).sort()]),
  ]);
  const hash = crypto.createHash("sha256").update(JSON.stringify(scoreMap)).digest("hex");
  assert.equal(hash, "32a620ae1a3603b3a2adc57aed05b5ab3798991971c505084e1f348a2128d4fd");
});

test("consecutive tests switch every gate to the other variant", () => {
  const first = selectQuestions("buy");
  const history = Object.fromEntries(first.map((question) => [question.gate, question.variant]));
  const second = selectQuestions("buy", history);
  assert.deepEqual(first.map((question) => question.gate), GATES);
  assert.deepEqual(first.map((question) => question.variant), [0, 0, 0, 0, 0]);
  assert.deepEqual(second.map((question) => question.variant), [1, 1, 1, 1, 1]);
});

test("identical paths and answers always produce an identical result", () => {
  const questions = selectQuestions("add");
  const answers = selections(questions, ["A", "B", "A", "C", "A"]);
  assert.deepEqual(evaluateQuiz("add", answers), evaluateQuiz("add", answers));
});

test("shared result state round-trips and recalculates the exact result", () => {
  const questions = selectQuestions("add", {
    impulse: 1,
    evidence: 0,
    plan: 1,
    regret: 0,
    counterfactual: 1,
  });
  const answers = selections(questions, ["A", "C", "B", "A", "C"]);
  const encoded = encodeSharedResult("add", questions.map((item) => item.id), answers);
  const decoded = decodeSharedResult(encoded);

  assert.ok(decoded);
  assert.equal(encoded, "p=add&v=01010&a=ACBAC");
  assert.deepEqual(decoded.questionIds, questions.map((item) => item.id));
  assert.deepEqual(evaluateQuiz(decoded.path, decoded.selections), evaluateQuiz("add", answers));
});

test("malformed shared result state is ignored", () => {
  for (const search of [
    "",
    "p=hold&v=01010&a=ABCAC",
    "p=buy&v=0101&a=ABCAC",
    "p=buy&v=0101x&a=ABCAC",
    "p=buy&v=01010&a=ABCA",
    "p=buy&v=01010&a=ABCAX",
  ]) {
    assert.equal(decodeSharedResult(search), null);
  }
});

test("four brake answers with no strong bias trigger the hidden persona", () => {
  const questions = selectQuestions("buy");
  const result = evaluateQuiz("buy", selections(questions, ["C", "C", "C", "C", "C"]));
  assert.equal(result.primary, "brake");
  assert.equal(result.secondary, null);
  assert.equal(result.scores.brake, 4);
  assert.ok(estimatePersonaShare(result) <= 3);
  assert.match(personaShareCopy(result), /镰刀集体失业/);
});

test("persona share is deterministic and always stays inside the entertainment range", () => {
  const reached = new Set<string>();
  for (const path of ["buy", "add", "sell"] as TradePath[]) {
    for (const variant of [0, 1] as const) {
      const questions = selectQuestions(
        path,
        Object.fromEntries(GATES.map((gate) => [gate, variant === 0 ? 1 : 0])),
      );
      for (let encoded = 0; encoded < 243; encoded += 1) {
        let value = encoded;
        const answers = questions.map(() => {
          const answer = (["A", "B", "C"] as const)[value % 3];
          value = Math.floor(value / 3);
          return answer;
        });
        const result = evaluateQuiz(path, selections(questions, answers));
        const percentage = estimatePersonaShare(result);
        reached.add(result.primary);
        assert.ok(percentage >= 1 && percentage <= 24);
        assert.equal(percentage, estimatePersonaShare(result));
        assert.ok(personaShareCopy(result, percentage));
      }
    }
  }
  assert.deepEqual([...reached].sort(), [...BIASES, "brake"].sort());
});

test("tie-breaking prefers counterfactual ownership before path priority", () => {
  const questions = selectQuestions("buy");
  const result = evaluateQuiz("buy", selections(questions, ["A", "A", "C", "C", "A"]));
  assert.equal(result.scores.fomo, 2);
  assert.equal(result.scores.overconfidence, 2);
  assert.equal(result.scores.bottom, 2);
  assert.equal(result.primary, "bottom");
});

test("path priority resolves an otherwise complete tie", () => {
  const result = evaluateQuiz("buy", [
    { questionId: "buy-impulse-a", optionId: "A" },
    { questionId: "buy-evidence-a", optionId: "A" },
  ]);
  assert.equal(result.scores.fomo, 2);
  assert.equal(result.scores.overconfidence, 2);
  assert.equal(result.primary, "fomo");
});

test("secondary persona appears only after reaching the three-point threshold", () => {
  const questions = selectQuestions("buy", {
    impulse: 0,
    evidence: 0,
    plan: 1,
    regret: 1,
    counterfactual: 0,
  });
  const result = evaluateQuiz("buy", selections(questions, ["A", "B", "B", "A", "B"]));
  assert.ok(result.secondary);
  assert.ok(result.scores[result.secondary!] >= 3);
});

test("all seven ordinary personas and the hidden persona are reachable", () => {
  const reached = new Set<string>();
  for (const path of ["buy", "add", "sell"] as TradePath[]) {
    for (const variant of [0, 1] as const) {
      const questions = selectQuestions(
        path,
        Object.fromEntries(GATES.map((gate) => [gate, variant === 0 ? 1 : 0])),
      );
      for (let encoded = 0; encoded < 243; encoded += 1) {
        let value = encoded;
        const answers = questions.map(() => {
          const answer = (["A", "B", "C"] as const)[value % 3];
          value = Math.floor(value / 3);
          return answer;
        });
        reached.add(evaluateQuiz(path, selections(questions, answers)).primary);
      }
    }
  }

  assert.deepEqual([...reached].sort(), [...BIASES, "brake"].sort());
  assert.equal(Object.keys(PERSONAS).length, 8);
});
