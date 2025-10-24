import micromatch from "micromatch";

export default {
  // Lint then format TypeScript and JavaScript files
  "**/*.(ts|tsx|js|jsx|mjs)": (filenames) => {
    const match = filenames.filter((file) => file.includes("routeTree.gen.ts"));
    return [
      `npx eslint --fix ${match.join(" ")}`,
      `npx prettier --write ${match.join(" ")}`,
    ];
  },

  // Format MarkDown
  "**/*.md,": (filenames) => `npx prettier --write ${filenames.join(" ")}`,

  // Format JSON
  "**/*.json,": (filenames) => `npx prettier --write ${filenames.join(" ")}`,
};
