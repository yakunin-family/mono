interface ExerciseType {
  id: string;
  name?: string;
  description?: string;
  taskDefinition: string;
}

const exerciseTypes = [
  "text-passage",
  "audio-clip",
  "video-content",
  "image-prompt",
  "multiple-choice",
  "true-false",
  "fill-blanks",
  "sequencing",
  "short-answer",
  "summary-writing",
  "opinion-writing",
  "discussion-prompt",
  "description-writing",
  "dictation",
  "role-play",
  "sentence-completion",
] as const;

const exerciseTypesMap: Record<string, ExerciseType> = {
  // MATERIAL PROVIDERS - Exercises that present content
  "text-passage": {
    id: "text-passage",
    name: "Reading Passage",
    description: "A text for students to read",
    taskDefinition: "Read the following text.",
  },

  "audio-clip": {
    id: "audio-clip",
    name: "Audio/Listening Material",
    description: "Audio content for listening practice",
    taskDefinition: "Listen to the following audio clip.",
  },

  "video-content": {
    id: "video-content",
    name: "Video Material",
    taskDefinition: "Watch the following video.",
  },

  "image-prompt": {
    id: "image-prompt",
    name: "Image/Visual Prompt",
    taskDefinition: "Look at the following image.",
  },

  // ASSESSMENT TYPES - Exercises that test understanding
  "multiple-choice": {
    id: "multiple-choice",
    name: "Multiple Choice Questions",
    taskDefinition: "Choose the correct answer from the options provided.",
  },

  "true-false": {
    id: "true-false",
    name: "True/False Statements",
    taskDefinition:
      "Determine whether the following statements are true or false.",
  },

  "fill-blanks": {
    id: "fill-blanks",
    name: "Fill in the Blanks",
    taskDefinition: "Fill in the missing words in the sentences below.",
  },

  sequencing: {
    id: "sequencing",
    name: "Sequence/Order Events",
    taskDefinition: "Arrange the following items in the correct order.",
  },

  // PRODUCTION TYPES - Exercises that require creating content
  "short-answer": {
    id: "short-answer",
    name: "Short Answer Questions",
    taskDefinition: "Provide a brief answer to the following questions.",
  },

  "summary-writing": {
    id: "summary-writing",
    name: "Write a Summary",
    taskDefinition: "Summarize the main points of the provided material.",
  },

  "opinion-writing": {
    id: "opinion-writing",
    name: "Opinion/Response Writing",
    taskDefinition: "Write your opinion or response to the following prompt.",
  },

  "discussion-prompt": {
    id: "discussion-prompt",
    name: "Discussion Questions",
    taskDefinition:
      "Discuss the following questions based on the material provided.",
  },

  "description-writing": {
    id: "description-writing",
    name: "Describe/Write About",
    taskDefinition: "Describe the following image or scenario in detail.",
  },

  dictation: {
    id: "dictation",
    name: "Dictation Exercise",
    taskDefinition: "Listen and write down what you hear.",
  },

  "role-play": {
    id: "role-play",
    name: "Role Play Scenario",
    taskDefinition: "Act out the following scenario.",
  },

  "sentence-completion": {
    id: "sentence-completion",
    name: "Complete the Sentences",
    taskDefinition: "Complete the following sentences.",
  },
};
