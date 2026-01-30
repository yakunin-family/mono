# Multiple Choice Exercise Rules

## XML Structure

Multiple choice exercises are built using exercises with structured options. Since the editor doesn't have a dedicated multiple-choice node, structure them clearly:

```xml
<exercise id="ex-mc-123">
  <h3>Reading Comprehension</h3>
  <p>Read the passage and answer the questions below.</p>

  <p><b>1. What is the main idea of the text?</b></p>
  <ol type="a">
    <li><p>The importance of exercise for health</p></li>
    <li><p>How to cook healthy meals</p></li>
    <li><p>The benefits of sleeping well</p></li>
    <li><p>Why water is essential</p></li>
  </ol>
  <p><i>Correct answer: a</i></p>

  <p><b>2. According to the text, how often should you exercise?</b></p>
  <ol type="a">
    <li><p>Once a month</p></li>
    <li><p>Three times a week</p></li>
    <li><p>Every day for an hour</p></li>
    <li><p>Only on weekends</p></li>
  </ol>
  <p><i>Correct answer: b</i></p>
</exercise>
```

## Alternative: Using Writing Areas for Answers

For interactive grading, you can use writing areas:

```xml
<exercise id="ex-mc-456">
  <h3>Grammar Quiz</h3>

  <p><b>1. Choose the correct form:</b> She ___ to school every day.</p>
  <p>a) go  b) goes  c) going  d) went</p>
  <writing-area id="wa-mc-1" lines="1" placeholder="Write your answer (a, b, c, or d)"><p></p></writing-area>

  <note><p>Correct answer: b) goes</p></note>
</exercise>
```

## Guidelines

1. **Four options**: Always provide exactly 4 options (a, b, c, d)
2. **One correct answer**: Only one option should be clearly correct
3. **Plausible distractors**: Wrong answers should be believable, not obviously wrong
4. **Similar length**: All options should be roughly the same length
5. **Avoid "all/none of the above"**: These are rarely good options
6. **Clear question stem**: The question should be complete and clear
7. **Teacher notes**: Use `<note>` for teacher-only answer keys

## Distractor Types

Good distractors are:

- **Common mistakes**: Errors students typically make
- **Partial truths**: Partially correct but not the best answer
- **Related concepts**: Similar but distinct ideas
- **Misreadings**: What students might think if they misread the question

## CEFR Level Guidelines

### A1-A2

- Simple, direct questions
- Obvious distinction between correct and incorrect
- Vocabulary within their level
- Short option texts

### B1-B2

- More nuanced questions
- Requires inference
- Subtle differences between options
- Longer option texts acceptable

### C1-C2

- Complex reasoning required
- Fine distinctions between options
- Sophisticated vocabulary
- May require synthesis of information

## Example: Good Question Design

**Good:**

```xml
<p><b>What did Maria do after breakfast?</b></p>
<ol type="a">
  <li><p>She went to work</p></li>
  <li><p>She watched television</p></li>
  <li><p>She called her mother</p></li>
  <li><p>She read a book</p></li>
</ol>
```

All options are parallel in structure and plausible.

**Bad:**

```xml
<p><b>What did Maria do?</b></p>
<ol type="a">
  <li><p>Went to work</p></li>
  <li><p>She was watching TV all day long and didn't do anything else</p></li>
  <li><p>Call mom</p></li>
  <li><p>Book</p></li>
</ol>
```

Options vary wildly in length and grammatical structure.
