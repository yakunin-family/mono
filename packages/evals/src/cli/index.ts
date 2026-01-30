import { Command } from "commander";
import { loadXmlFixture } from "../utils/loader.js";
import { runAgent } from "../agent/index.js";
import { getPrompt, listPrompts } from "../prompts/loader.js";

const program = new Command();

program.name("evals").description("Run exercise generation evaluations");

program
  .command("run")
  .description("Run test cases")
  .option("--all", "Run all test cases")
  .option("--type <type>", "Exercise type (fill-blanks, etc.)")
  .option("--case <case>", "Specific test case")
  .option("--level <level>", "CEFR level (A2, B1, B2, C1)")
  .option("--output <file>", "Output results to file")
  .action(async (options) => {
    console.log("Run command - not implemented in this patch");
  });

program
  .command("agent")
  .description("Test agent directly")
  .option("--fixture <name>", "XML fixture to use")
  .option("--instruction <text>", "Instruction for agent")
  .option("--prompt <id|path>", "Prompt ID or path to use")
  .option("--skill <name>", "Skill name (fill-blanks, multiple-choice, etc.)")
  .action(async (options) => {
    try {
      if (!options.fixture) {
        console.error("--fixture is required");
        process.exit(2);
      }

      // Load document XML (resolved relative to package)
      const documentXml = loadXmlFixture(options.fixture);

      // Resolve instruction and skill per plan rules
      let instruction = options.instruction;
      let skill = options.skill;

      if (options.prompt) {
        // getPrompt may accept an id or a path; loader resolves accordingly
        const prompt = await getPrompt(options.prompt);
        if (prompt) {
          const promptInstruction =
            prompt.instruction || prompt.body || undefined;
          // Merge: promptInstruction first, then explicit instruction
          if (promptInstruction && instruction) {
            instruction = `${promptInstruction}\n\nUser instruction: ${instruction}`;
          } else if (promptInstruction) {
            instruction = promptInstruction;
          }

          if (!skill && prompt.skill) skill = prompt.skill;
        } else {
          console.error(`Prompt not found: ${options.prompt}`);
          process.exit(3);
        }
      }

      if (!instruction) {
        console.error(
          "No instruction provided (either --instruction or --prompt must supply instruction)",
        );
        process.exit(4);
      }

      const result = await runAgent(documentXml, instruction, skill);
      console.log(
        JSON.stringify(
          {
            id: options.prompt ?? null,
            input: instruction,
            output: result.output,
            status: "ok",
            usage: result.usage,
          },
          null,
          2,
        ),
      );
    } catch (err) {
      console.error("Agent command failed:", err);
      process.exit(1);
    }
  });

program
  .command("score")
  .description("Score a result")
  .option("--result <file>", "Result file to score")
  .option("--case <case>", "Test case definition")
  .action(async (options) => {
    console.log("Score command - not implemented in this patch");
  });

program.parse();
