export default {
  ignores: ["**/routeTree.gen.ts"],
  // Lint then format TypeScript and JavaScript files
  "**/*.(ts|tsx|js|jsx|mjs)": (filenames) => [
    `npx eslint --fix ${filenames.join(" ")}`,
    `npx prettier --write ${filenames.join(" ")}`,
  ],

  // Format MarkDown
  "**/*.md,": (filenames) => `npx prettier --write ${filenames.join(" ")}`,

  // Format JSON
  "**/*.json,": (filenames) => `npx prettier --write ${filenames.join(" ")}`,
};
