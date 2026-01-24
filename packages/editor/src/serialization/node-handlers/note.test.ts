import { describe, expect, it } from "vitest";

import { serializeNote } from "./note";

describe("serializeNote", () => {
  it("serializes note with content", () => {
    const serializeChildren = () => "<p>Teacher note here</p>";
    expect(
      serializeNote(
        {
          type: "noteBlock",
          content: [],
        },
        serializeChildren,
      ),
    ).toBe("<note><p>Teacher note here</p></note>");
  });

  it("serializes empty note", () => {
    const serializeChildren = () => "";
    expect(
      serializeNote(
        {
          type: "noteBlock",
        },
        serializeChildren,
      ),
    ).toBe("<note></note>");
  });

  it("serializes note with multiple paragraphs", () => {
    const serializeChildren = () =>
      "<p>First paragraph</p><p>Second paragraph</p>";
    expect(
      serializeNote(
        {
          type: "noteBlock",
          content: [],
        },
        serializeChildren,
      ),
    ).toBe("<note><p>First paragraph</p><p>Second paragraph</p></note>");
  });
});
