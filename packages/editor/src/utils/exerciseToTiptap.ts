import type { JSONContent } from "@tiptap/core";
import type {
  ExerciseContent,
  MultipleChoiceExercise,
  TrueFalseExercise,
  FillBlanksExercise,
  SequencingExercise,
  ShortAnswerExercise,
  ReadingPassageExercise,
  DiscussionPromptExercise,
  WritingExercise,
  GenericExercise,
} from "../types/exerciseGeneration";

/**
 * Converts generated exercise content to Tiptap JSON nodes.
 * Each exercise type is converted to appropriate Tiptap structures.
 */
export function exerciseToTiptap(exercise: ExerciseContent): JSONContent[] {
  switch (exercise.type) {
    case "multiple-choice":
      return multipleChoiceToTiptap(exercise as MultipleChoiceExercise);
    case "true-false":
      return trueFalseToTiptap(exercise as TrueFalseExercise);
    case "fill-blanks":
      return fillBlanksToTiptap(exercise as FillBlanksExercise);
    case "sequencing":
      return sequencingToTiptap(exercise as SequencingExercise);
    case "short-answer":
      return shortAnswerToTiptap(exercise as ShortAnswerExercise);
    case "text-passage":
      return textPassageToTiptap(exercise as ReadingPassageExercise);
    case "discussion-prompt":
      return discussionPromptToTiptap(exercise as DiscussionPromptExercise);
    case "summary-writing":
    case "opinion-writing":
    case "description-writing":
    case "sentence-completion":
      return writingToTiptap(exercise as WritingExercise);
    default:
      return genericToTiptap(exercise as GenericExercise);
  }
}

/**
 * Multiple Choice: Title → Instructions → Questions with options
 */
function multipleChoiceToTiptap(ex: MultipleChoiceExercise): JSONContent[] {
  const nodes: JSONContent[] = [
    {
      type: "heading",
      attrs: { level: 3 },
      content: [{ type: "text", text: ex.title }],
    },
    {
      type: "paragraph",
      content: [{ type: "text", text: ex.instructions }],
    },
  ];

  ex.questions.forEach((q, idx) => {
    // Question
    nodes.push({
      type: "paragraph",
      content: [
        {
          type: "text",
          text: `${idx + 1}. ${q.question}`,
          marks: [{ type: "bold" }],
        },
      ],
    });

    // Options as bullet list
    nodes.push({
      type: "bulletList",
      content: q.options.map((opt) => ({
        type: "listItem",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: opt.text }],
          },
        ],
      })),
    });

    // Explanation (if provided)
    if (q.explanation) {
      nodes.push({
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "Explanation: ",
            marks: [{ type: "italic" }],
          },
          {
            type: "text",
            text: q.explanation,
            marks: [{ type: "italic" }],
          },
        ],
      });
    }
  });

  return nodes;
}

/**
 * True/False: Title → Instructions → Statements
 */
function trueFalseToTiptap(ex: TrueFalseExercise): JSONContent[] {
  const nodes: JSONContent[] = [
    {
      type: "heading",
      attrs: { level: 3 },
      content: [{ type: "text", text: ex.title }],
    },
    {
      type: "paragraph",
      content: [{ type: "text", text: ex.instructions }],
    },
  ];

  ex.statements.forEach((stmt, idx) => {
    nodes.push({
      type: "paragraph",
      content: [
        {
          type: "text",
          text: `${idx + 1}. ${stmt.statement}`,
        },
      ],
    });

    if (stmt.explanation) {
      nodes.push({
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "Explanation: ",
            marks: [{ type: "italic" }],
          },
          {
            type: "text",
            text: stmt.explanation,
            marks: [{ type: "italic" }],
          },
        ],
      });
    }
  });

  return nodes;
}

/**
 * Fill in the Blanks: Title → Instructions → Sentences with underscores
 */
function fillBlanksToTiptap(ex: FillBlanksExercise): JSONContent[] {
  const nodes: JSONContent[] = [
    {
      type: "heading",
      attrs: { level: 3 },
      content: [{ type: "text", text: ex.title }],
    },
    {
      type: "paragraph",
      content: [{ type: "text", text: ex.instructions }],
    },
  ];

  ex.items.forEach((item, idx) => {
    const parts: JSONContent[] = [];
    let lastIndex = 0;
    const regex = /\[\[blank\]\]/g;
    let match;
    let blankIndex = 0;

    while ((match = regex.exec(item.sentence)) !== null) {
      // Add text before blank
      if (match.index > lastIndex) {
        parts.push({
          type: "text",
          text: item.sentence.slice(lastIndex, match.index)
        });
      }

      // Get metadata by position (order in array matches order in sentence)
      const metadata = item.blanks[blankIndex] || {
        id: `blank${blankIndex}`,
        correctAnswer: "",
        alternativeAnswers: [],
        hint: null
      };

      // Add blank node
      parts.push({
        type: "blank",
        attrs: {
          blankIndex: blankIndex,
          correctAnswer: metadata.correctAnswer,
          alternativeAnswers: metadata.alternativeAnswers || [],
          hint: metadata.hint || null,
          studentAnswer: ""
        }
      });

      blankIndex++;
      lastIndex = regex.lastIndex;
    }

    // Add remaining text
    if (lastIndex < item.sentence.length) {
      parts.push({
        type: "text",
        text: item.sentence.slice(lastIndex)
      });
    }

    // Wrap in paragraph with question number
    nodes.push({
      type: "paragraph",
      content: [
        { type: "text", text: `${idx + 1}. ` },
        ...parts
      ]
    });
  });

  return nodes;
}

/**
 * Sequencing: Title → Instructions → Items to order
 */
function sequencingToTiptap(ex: SequencingExercise): JSONContent[] {
  const nodes: JSONContent[] = [
    {
      type: "heading",
      attrs: { level: 3 },
      content: [{ type: "text", text: ex.title }],
    },
    {
      type: "paragraph",
      content: [{ type: "text", text: ex.instructions }],
    },
  ];

  if (ex.context) {
    nodes.push({
      type: "paragraph",
      content: [
        {
          type: "text",
          text: ex.context,
          marks: [{ type: "italic" }],
        },
      ],
    });
  }

  // Items as bullet list (shuffled order)
  nodes.push({
    type: "bulletList",
    content: ex.items.map((item) => ({
      type: "listItem",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: item.content }],
        },
      ],
    })),
  });

  return nodes;
}

/**
 * Short Answer: Title → Instructions → Questions with space for answers
 */
function shortAnswerToTiptap(ex: ShortAnswerExercise): JSONContent[] {
  const nodes: JSONContent[] = [
    {
      type: "heading",
      attrs: { level: 3 },
      content: [{ type: "text", text: ex.title }],
    },
    {
      type: "paragraph",
      content: [{ type: "text", text: ex.instructions }],
    },
  ];

  ex.questions.forEach((q, idx) => {
    nodes.push({
      type: "paragraph",
      content: [
        {
          type: "text",
          text: `${idx + 1}. ${q.question}`,
          marks: [{ type: "bold" }],
        },
      ],
    });

    // Add blank lines for answer
    nodes.push(
      {
        type: "paragraph",
        content: [{ type: "text", text: "" }],
      },
      {
        type: "paragraph",
        content: [{ type: "text", text: "" }],
      }
    );

    // Teacher guidelines (if provided)
    if (q.expectedAnswerGuidelines) {
      nodes.push({
        type: "paragraph",
        content: [
          {
            type: "text",
            text: "Expected answer: ",
            marks: [{ type: "italic" }],
          },
          {
            type: "text",
            text: q.expectedAnswerGuidelines,
            marks: [{ type: "italic" }],
          },
        ],
      });
    }
  });

  return nodes;
}

/**
 * Reading Passage: Title → Content
 */
function textPassageToTiptap(ex: ReadingPassageExercise): JSONContent[] {
  const nodes: JSONContent[] = [
    {
      type: "heading",
      attrs: { level: 3 },
      content: [{ type: "text", text: ex.title }],
    },
  ];

  // Split content into paragraphs
  const paragraphs = ex.content.split("\n\n").filter(Boolean);
  paragraphs.forEach((para) => {
    nodes.push({
      type: "paragraph",
      content: [{ type: "text", text: para.trim() }],
    });
  });

  // Metadata (if provided)
  if (ex.metadata?.wordCount || ex.metadata?.readingTime) {
    const metaText: string[] = [];
    if (ex.metadata.wordCount) {
      metaText.push(`${ex.metadata.wordCount} words`);
    }
    if (ex.metadata.readingTime) {
      metaText.push(`${ex.metadata.readingTime} min read`);
    }

    nodes.push({
      type: "paragraph",
      content: [
        {
          type: "text",
          text: `(${metaText.join(", ")})`,
          marks: [{ type: "italic" }],
        },
      ],
    });
  }

  return nodes;
}

/**
 * Discussion Prompt: Title → Prompt → Guiding questions
 */
function discussionPromptToTiptap(ex: DiscussionPromptExercise): JSONContent[] {
  const nodes: JSONContent[] = [
    {
      type: "heading",
      attrs: { level: 3 },
      content: [{ type: "text", text: ex.title }],
    },
    {
      type: "paragraph",
      content: [{ type: "text", text: ex.prompt }],
    },
  ];

  if (ex.context) {
    nodes.push({
      type: "paragraph",
      content: [
        {
          type: "text",
          text: ex.context,
          marks: [{ type: "italic" }],
        },
      ],
    });
  }

  if (ex.guidingQuestions && ex.guidingQuestions.length > 0) {
    nodes.push({
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "Consider:",
          marks: [{ type: "bold" }],
        },
      ],
    });

    nodes.push({
      type: "bulletList",
      content: ex.guidingQuestions.map((q) => ({
        type: "listItem",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: q }],
          },
        ],
      })),
    });
  }

  return nodes;
}

/**
 * Writing Exercises: Title → Instructions → Prompt → Word count
 */
function writingToTiptap(ex: WritingExercise): JSONContent[] {
  const nodes: JSONContent[] = [
    {
      type: "heading",
      attrs: { level: 3 },
      content: [{ type: "text", text: ex.title }],
    },
    {
      type: "paragraph",
      content: [{ type: "text", text: ex.instructions }],
    },
    {
      type: "paragraph",
      content: [
        {
          type: "text",
          text: ex.prompt,
          marks: [{ type: "bold" }],
        },
      ],
    },
  ];

  // Word count target
  if (ex.wordCountTarget) {
    const { min, max } = ex.wordCountTarget;
    let wordCountText = "";

    if (min && max) {
      wordCountText = `Target: ${min}-${max} words`;
    } else if (min) {
      wordCountText = `Minimum: ${min} words`;
    } else if (max) {
      wordCountText = `Maximum: ${max} words`;
    }

    if (wordCountText) {
      nodes.push({
        type: "paragraph",
        content: [
          {
            type: "text",
            text: wordCountText,
            marks: [{ type: "italic" }],
          },
        ],
      });
    }
  }

  // Rubric (if provided)
  if (ex.rubric && ex.rubric.length > 0) {
    nodes.push({
      type: "paragraph",
      content: [
        {
          type: "text",
          text: "Rubric:",
          marks: [{ type: "bold" }],
        },
      ],
    });

    nodes.push({
      type: "bulletList",
      content: ex.rubric.map((criterion) => ({
        type: "listItem",
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: `${criterion.criterion} (${criterion.maxPoints} pts): ${criterion.description}`,
              },
            ],
          },
        ],
      })),
    });
  }

  return nodes;
}

/**
 * Generic fallback: Title → Instructions → Content
 */
function genericToTiptap(ex: GenericExercise): JSONContent[] {
  const nodes: JSONContent[] = [
    {
      type: "heading",
      attrs: { level: 3 },
      content: [{ type: "text", text: ex.title }],
    },
    {
      type: "paragraph",
      content: [{ type: "text", text: ex.instructions }],
    },
  ];

  // Try to render content as JSON string or plain text
  if (typeof ex.content === "string") {
    nodes.push({
      type: "paragraph",
      content: [{ type: "text", text: ex.content }],
    });
  } else if (typeof ex.content === "object") {
    nodes.push({
      type: "paragraph",
      content: [{ type: "text", text: JSON.stringify(ex.content, null, 2) }],
    });
  }

  return nodes;
}
