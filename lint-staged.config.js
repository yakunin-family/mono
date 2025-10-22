export default {
  // Format MarkDown
  "**/*.md,": (filenames) => `npx prettier --write ${filenames.join(" ")}`,

  // Format JSON
  "**/*.json,": (filenames) => `npx prettier --write ${filenames.join(" ")}`,
};
