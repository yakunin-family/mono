import { describe, expect, it } from "vitest";

import { serializeWritingArea } from "./writing-area";

describe("serializeWritingArea", () => {
  it("serializes writing area with all attributes", () => {
    const serializeChildren = () => "<p></p>";
    expect(
      serializeWritingArea(
        {
          type: "writingArea",
          attrs: {
            id: "wa-1",
            lines: 8,
            placeholder: "Write your answer...",
          },
          content: [],
        },
        serializeChildren,
      ),
    ).toBe(
      '<writing-area id="wa-1" lines="8" placeholder="Write your answer..."><p></p></writing-area>',
    );
  });

  it("serializes writing area with default lines", () => {
    const serializeChildren = () => "<p></p>";
    expect(
      serializeWritingArea(
        {
          type: "writingArea",
          attrs: {
            id: "wa-2",
            placeholder: "Answer here",
          },
          content: [],
        },
        serializeChildren,
      ),
    ).toBe(
      '<writing-area id="wa-2" lines="5" placeholder="Answer here"><p></p></writing-area>',
    );
  });

  it("serializes writing area without id", () => {
    const serializeChildren = () => "<p>Student content</p>";
    expect(
      serializeWritingArea(
        {
          type: "writingArea",
          attrs: {
            lines: 3,
          },
          content: [],
        },
        serializeChildren,
      ),
    ).toBe('<writing-area lines="3"><p>Student content</p></writing-area>');
  });

  it("escapes special characters in placeholder", () => {
    const serializeChildren = () => "<p></p>";
    expect(
      serializeWritingArea(
        {
          type: "writingArea",
          attrs: {
            id: "wa-3",
            lines: 5,
            placeholder: 'Write "your" answer & thoughts',
          },
          content: [],
        },
        serializeChildren,
      ),
    ).toBe(
      '<writing-area id="wa-3" lines="5" placeholder="Write &quot;your&quot; answer &amp; thoughts"><p></p></writing-area>',
    );
  });
});
