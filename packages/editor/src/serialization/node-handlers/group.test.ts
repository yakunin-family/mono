import { describe, expect, it } from "vitest";

import { serializeGroup } from "./group";

describe("serializeGroup", () => {
  it("serializes group with id", () => {
    const serializeChildren = () => "<p>Grouped content</p>";
    expect(
      serializeGroup(
        {
          type: "group",
          attrs: { id: "group-abc123" },
          content: [],
        },
        serializeChildren,
      ),
    ).toBe('<group id="group-abc123"><p>Grouped content</p></group>');
  });

  it("serializes group without id", () => {
    const serializeChildren = () => "<p>Content</p>";
    expect(
      serializeGroup(
        {
          type: "group",
          attrs: {},
          content: [],
        },
        serializeChildren,
      ),
    ).toBe("<group><p>Content</p></group>");
  });

  it("serializes group with multiple children", () => {
    const serializeChildren = () =>
      "<p>First</p><exercise><p>Exercise content</p></exercise>";
    expect(
      serializeGroup(
        {
          type: "group",
          attrs: { id: "grp-1" },
          content: [],
        },
        serializeChildren,
      ),
    ).toBe(
      '<group id="grp-1"><p>First</p><exercise><p>Exercise content</p></exercise></group>',
    );
  });

  it("escapes special characters in id", () => {
    const serializeChildren = () => "<p>Content</p>";
    expect(
      serializeGroup(
        {
          type: "group",
          attrs: { id: 'group-"test"' },
          content: [],
        },
        serializeChildren,
      ),
    ).toBe('<group id="group-&quot;test&quot;"><p>Content</p></group>');
  });
});
