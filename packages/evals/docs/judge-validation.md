# Judge Validation & Calibration Guide

## Purpose

This document provides the methodology, review templates, and calibration guidance for validating the LLM judge used in the exercise quality scorer. The goal is to ensure that Claude's automated scoring aligns with human expert assessment before expanding the eval suite to all exercise types.

**When to use this document:**

1. After running the fill-blanks eval suite for the first time against a live Convex deployment
2. When calibrating the scorer after rubric changes
3. As a reference for interpreting alignment rates

---

## Scoring Dimensions

The exercise quality scorer (`scorers/exercise-quality.ts`) evaluates each generated exercise across 4 dimensions:

| Dimension                      | Method            | Description                                                    | Threshold |
| ------------------------------ | ----------------- | -------------------------------------------------------------- | --------- |
| `structural_validity`          | **Deterministic** | Checks for `<exercise>` container + type-specific XML elements | 0.70      |
| `difficulty_match`             | LLM Judge         | Is difficulty appropriate for the stated CEFR level?           | 0.70      |
| `instruction_clarity`          | LLM Judge         | Are instructions unambiguous? Would a student know what to do? | 0.70      |
| `learning_objective_alignment` | LLM Judge         | Does the exercise test the skill/concept from the instruction? | 0.70      |

**Overall score** = arithmetic mean of all 4 dimensions.  
**Pass/Fail** = ALL dimensions must individually meet the 0.70 threshold.

### Structural Validity (Deterministic)

This dimension requires no LLM and needs no calibration. For fill-blanks exercises, it checks:

- Presence of `<exercise>` and `</exercise>` container tags
- Presence of `<blank` elements with `answer=` attribute and `student-answer=""`

A score of 1.0 means all checks pass. 0.5 means the container exists but type-specific checks fail. 0.0 means no container.

---

## Validation Methodology

### Step-by-Step Process

1. **Run the fill-blanks eval suite** against a live Convex deployment:

   ```bash
   cd packages/evals
   npx promptfoo eval -c cases/fill-blanks.yaml
   ```

2. **Collect outputs** from `results/latest.json` — each entry contains the agent's generated exercise XML and the judge's dimension scores with reasoning.

3. **Manually review 10 outputs** using the review template below. For each output:
   - Read the source document XML and the instruction
   - Read the generated exercise
   - Independently score each LLM-judged dimension (0.0, 0.5, or 1.0)
   - Compare your score to the judge's score
   - Note any disagreements and the reason

4. **Calculate alignment rate**: percentage of dimension scores where human and judge agree (within ±0.15 tolerance).

5. **Interpret results** using the alignment guide below.

6. **Adjust rubrics** if alignment is below threshold (see Rubric Adjustment section).

### Scoring Guidelines for Manual Review

When scoring manually, use these anchors:

**Difficulty Match:**

- 1.0 — Vocabulary and grammar structures are precisely calibrated for the CEFR level. An A2 exercise uses basic nouns/verbs; a C1 exercise uses academic/figurative language.
- 0.5 — Difficulty is in the right ballpark but could be better calibrated (e.g., slightly too easy or too hard for the level).
- 0.0 — Completely wrong level (college-level content for beginners, or trivial content for advanced learners).

**Instruction Clarity:**

- 1.0 — A student could complete the exercise without any additional explanation. The instructions specify what to do, how to respond, and what the goal is.
- 0.5 — Instructions exist but leave room for interpretation (e.g., "fill in the blanks" without specifying whether to use words from a word bank or free recall).
- 0.0 — Instructions are missing, contradictory, or completely confusing.

**Learning Objective Alignment:**

- 1.0 — The exercise directly tests the skill or concept specified in the teacher's instruction (e.g., instruction says "target conditional structures" and blanks are all conditionals).
- 0.5 — Partially aligned — the exercise tests something related but misses the core objective.
- 0.0 — The exercise tests something entirely different from what was requested.

---

## Review Template

Use this template to record manual assessments. Fill in one row per test case after running the eval suite.

### Fill-Blanks Test Cases (12 total)

| #   | CEFR | Focus                   | Human: Struct | Judge: Struct | Human: Diff | Judge: Diff | Human: Clarity | Judge: Clarity | Human: Align | Judge: Align | Agreement? | Notes |
| --- | ---- | ----------------------- | ------------- | ------------- | ----------- | ----------- | -------------- | -------------- | ------------ | ------------ | ---------- | ----- |
| 1   | A2   | Common vocabulary       | —             | —             | —           | —           | —              | —              | —            | —            | —          |       |
| 2   | A2   | Time expressions        | —             | —             | —           | —           | —              | —              | —            | —            | —          |       |
| 3   | A2   | Multiple blanks (3+)    | —             | —             | —           | —           | —              | —              | —            | —            | —          |       |
| 4   | B1   | Scientific vocabulary   | —             | —             | —           | —           | —              | —              | —            | —            | —          |       |
| 5   | B1   | Collocations/word pairs | —             | —             | —           | —           | —              | —              | —            | —            | —          |       |
| 6   | B1   | Verb forms/tenses       | —             | —             | —           | —           | —              | —              | —            | —            | —          |       |
| 7   | B2   | Conditional structures  | —             | —             | —           | —           | —              | —              | —            | —            | —          |       |
| 8   | B2   | Modal verbs             | —             | —             | —           | —           | —              | —              | —            | —            | —          |       |
| 9   | B2   | Discourse markers       | —             | —             | —           | —           | —              | —              | —            | —            | —          |       |
| 10  | C1   | Academic vocabulary     | —             | —             | —           | —           | —              | —              | —            | —            | —          |       |
| 11  | C1   | Figurative language     | —             | —             | —           | —           | —              | —              | —            | —            | —          |       |
| 12  | C1   | Mixed difficulty        | —             | —             | —           | —           | —              | —              | —            | —            | —          |       |

**Note:** `Struct` (structural_validity) is deterministic — human and judge scores should always match. If they don't, there's a bug in the checker.

### Summary Metrics

| Metric                              | Value |
| ----------------------------------- | ----- |
| Total cases reviewed                | /12   |
| Dimension agreements (within ±0.15) | /36   |
| Overall alignment rate              | %     |
| Dimension with lowest alignment     |       |
| Dimension with highest alignment    |       |

---

## Calibration Notes

### Known LLM Judge Tendencies

Based on the scorer design and general LLM-as-judge research, be aware of these calibration patterns:

1. **Instruction Clarity — Leniency Bias**
   - LLM judges tend to score instruction clarity higher than warranted. An instruction like "fill in the blanks" without specifying word bank vs. free recall often receives 0.8+ from the judge.
   - **Mitigation:** When reviewing manually, be strict about whether a student could complete the exercise without asking questions.

2. **Difficulty Match — Surface-Level Assessment**
   - Judges may over-score difficulty_match when vocabulary _looks_ advanced but surrounding context makes answers obvious. Conversely, they may under-score when simple words are used in complex grammatical structures.
   - **Mitigation:** Consider whether the _cognitive demand_ matches the level, not just the vocabulary complexity.

3. **Learning Objective Alignment — Most Reliable**
   - This dimension tends to have the best human-judge agreement because it's the most concrete: either the exercise tests the requested skill or it doesn't.
   - **Mitigation:** None needed — use this as your baseline for calibration confidence.

4. **Structural Validity — No Calibration Needed**
   - This is a deterministic check. If human and judge disagree here, investigate the checker logic, not the LLM.

### CEFR Level Calibration

Different CEFR levels may require different calibration:

- **A2 exercises** — Judge may be too lenient on difficulty (basic exercises often score high)
- **C1 exercises** — Judge may be too strict on difficulty (academic vocabulary can look harder than it is with context)
- **B1/B2 exercises** — Usually the most reliable range for judge calibration

---

## Alignment Interpretation Guide

| Alignment Rate | Interpretation           | Action                                                                                                    |
| -------------- | ------------------------ | --------------------------------------------------------------------------------------------------------- |
| **≥80%**       | Judge is well-calibrated | ✅ Proceed to create remaining exercise type test cases (Task 9)                                          |
| **70–80%**     | Minor calibration drift  | ⚠️ Document specific disagreement cases. Consider tightening 1–2 dimension rubrics. Proceed with caution. |
| **60–70%**     | Significant drift        | 🔧 Adjust rubric prompts for the weakest dimension(s). Re-run validation on 5 cases before proceeding.    |
| **<60%**       | Judge unreliable         | 🛑 STOP. Major rubric revision required. Do not expand to other exercise types until resolved.            |

---

## Rubric Adjustment Guidance

If alignment is below threshold, adjust the judge prompt in `scorers/exercise-quality.ts` → `buildJudgePrompt()`.

### How to Tighten a Dimension

**Example: Instruction Clarity is over-scored**

Current rubric anchor:

```
- 0.5: Instructions exist but are ambiguous
- 1.0: Instructions are crystal clear, student knows exactly what to do
```

Tightened version:

```
- 0.5: Instructions exist but leave room for interpretation (e.g., does not specify word bank vs. free recall, or does not clarify expected answer length)
- 1.0: Instructions explicitly state: (a) what the student must do, (b) how to format the answer, and (c) any constraints (word bank, hints, etc.)
```

### How to Add Negative Examples

For dimensions where the judge is too lenient, add explicit negative examples to the prompt:

```
IMPORTANT: Do NOT score 0.8+ if:
- The instruction only says "fill in the blanks" without specifying the learning target
- The blanks could be answered by guessing from immediate context alone
- There is no indication of what skill is being tested
```

### General Principles

1. **Be specific about what 0.5 means** — vague middle anchors lead to score inflation
2. **Add "do not score high if..." guards** for dimensions with known leniency bias
3. **Test adjustments on 3–5 cases** before re-running the full suite
4. **Document every rubric change** with the reason and the cases that motivated it

---

## Inter-Rater Reliability

For formal measurement of human-judge agreement, use **Cohen's Kappa (κ)**:

- κ > 0.80 — Almost perfect agreement
- κ 0.61–0.80 — Substantial agreement (target for this system)
- κ 0.41–0.60 — Moderate agreement (needs improvement)
- κ < 0.40 — Fair or poor agreement (rubric revision required)

To calculate κ, treat each dimension score as a categorical rating (0.0, 0.5, 1.0) and compute agreement across all reviewed cases per dimension.

**Note:** Cohen's Kappa is more conservative than simple agreement rate because it accounts for chance agreement. Use it as the primary metric when making go/no-go decisions about expanding the eval suite.

---

## Revision History

| Date       | Author  | Change                                            |
| ---------- | ------- | ------------------------------------------------- |
| 2026-01-28 | Initial | Created validation template and calibration guide |
