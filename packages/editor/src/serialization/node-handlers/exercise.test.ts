import { describe, expect, it } from "vitest";

import { serializeBlank, serializeExercise } from "./exercise";

describe("serializeBlank", () => {
  const noopChildren = () => "";

  it("serializes blank with answer only", () => {
    expect(
      serializeBlank(
        {
          type: "blank",
          attrs: {
            correctAnswer: "goes",
            alternativeAnswers: [],
            hint: null,
            studentAnswer: "",
          },
        },
        noopChildren,
      ),
    ).toBe('<blank answer="goes" student-answer="" />');
  });

  it("serializes blank with alternatives", () => {
    expect(
      serializeBlank(
        {
          type: "blank",
          attrs: {
            correctAnswer: "went",
            alternativeAnswers: ["had gone", "was going"],
            hint: null,
            studentAnswer: "",
          },
        },
        noopChildren,
      ),
    ).toBe(
      '<blank answer="went" alts="had gone,was going" student-answer="" />',
    );
  });

  it("serializes blank with hint", () => {
    expect(
      serializeBlank(
        {
          type: "blank",
          attrs: {
            correctAnswer: "runs",
            alternativeAnswers: [],
            hint: "present tense",
            studentAnswer: "",
          },
        },
        noopChildren,
      ),
    ).toBe('<blank answer="runs" hint="present tense" student-answer="" />');
  });

  it("serializes blank with student answer", () => {
    expect(
      serializeBlank(
        {
          type: "blank",
          attrs: {
            correctAnswer: "went",
            alternativeAnswers: [],
            hint: null,
            studentAnswer: "goed",
          },
        },
        noopChildren,
      ),
    ).toBe('<blank answer="went" student-answer="goed" />');
  });

  it("serializes blank with all attributes", () => {
    expect(
      serializeBlank(
        {
          type: "blank",
          attrs: {
            correctAnswer: "went",
            alternativeAnswers: ["had gone"],
            hint: "irregular verb",
            studentAnswer: "goed",
          },
        },
        noopChildren,
      ),
    ).toBe(
      '<blank answer="went" alts="had gone" hint="irregular verb" student-answer="goed" />',
    );
  });

  it("escapes special characters in answer", () => {
    expect(
      serializeBlank(
        {
          type: "blank",
          attrs: {
            correctAnswer: 'say "hello"',
            alternativeAnswers: [],
            hint: null,
            studentAnswer: "",
          },
        },
        noopChildren,
      ),
    ).toBe('<blank answer="say &quot;hello&quot;" student-answer="" />');
  });

  it("escapes special characters in alternatives", () => {
    expect(
      serializeBlank(
        {
          type: "blank",
          attrs: {
            correctAnswer: "a",
            alternativeAnswers: ["a & b", "c < d"],
            hint: null,
            studentAnswer: "",
          },
        },
        noopChildren,
      ),
    ).toBe('<blank answer="a" alts="a &amp; b,c &lt; d" student-answer="" />');
  });
});

describe("serializeExercise", () => {
  it("serializes exercise without id", () => {
    const serializeChildren = () => "<p>Content</p>";
    expect(
      serializeExercise(
        {
          type: "exercise",
          attrs: {},
          content: [],
        },
        serializeChildren,
      ),
    ).toBe("<exercise><p>Content</p></exercise>");
  });

  it("serializes exercise with id", () => {
    const serializeChildren = () => "<p>Content</p>";
    expect(
      serializeExercise(
        {
          type: "exercise",
          attrs: { instanceId: "ex-abc123" },
          content: [],
        },
        serializeChildren,
      ),
    ).toBe('<exercise id="ex-abc123"><p>Content</p></exercise>');
  });

  it("does not include index attribute", () => {
    const serializeChildren = () => "<p>Content</p>";
    const result = serializeExercise(
      {
        type: "exercise",
        attrs: { instanceId: "ex-1", index: 5 },
        content: [],
      },
      serializeChildren,
    );
    expect(result).not.toContain("index");
    expect(result).toBe('<exercise id="ex-1"><p>Content</p></exercise>');
  });

  it("escapes special characters in id", () => {
    const serializeChildren = () => "<p>Content</p>";
    expect(
      serializeExercise(
        {
          type: "exercise",
          attrs: { instanceId: 'ex-"special"' },
          content: [],
        },
        serializeChildren,
      ),
    ).toBe('<exercise id="ex-&quot;special&quot;"><p>Content</p></exercise>');
  });
});
