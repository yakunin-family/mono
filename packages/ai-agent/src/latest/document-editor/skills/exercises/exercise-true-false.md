# True/False Exercise Rules

## XML Structure

True/false exercises present statements that students must evaluate:

```xml
<exercise id="ex-tf-123">
  <h3>True or False</h3>
  <p>Read each statement and decide if it is true or false based on the text above.</p>

  <ol>
    <li>
      <p>The sun rises in the east. <writing-area id="wa-tf-1" lines="1" placeholder="True or False"><p></p></writing-area></p>
      <note><p>True</p></note>
    </li>
    <li>
      <p>Water freezes at 50 degrees Celsius. <writing-area id="wa-tf-2" lines="1" placeholder="True or False"><p></p></writing-area></p>
      <note><p>False - Water freezes at 0 degrees Celsius</p></note>
    </li>
    <li>
      <p>Paris is the capital of France. <writing-area id="wa-tf-3" lines="1" placeholder="True or False"><p></p></writing-area></p>
      <note><p>True</p></note>
    </li>
  </ol>
</exercise>
```

## Alternative: Simple List Format

For quicker exercises without interactive elements:

```xml
<exercise id="ex-tf-456">
  <h3>True or False?</h3>
  <p>Mark each statement as T (true) or F (false).</p>

  <p>1. ___ Cats are mammals.</p>
  <p>2. ___ The Earth is flat.</p>
  <p>3. ___ Spanish is spoken in Mexico.</p>

  <note>
    <p>Answer key:</p>
    <p>1. T - Cats are indeed mammals</p>
    <p>2. F - The Earth is roughly spherical</p>
    <p>3. T - Spanish is the primary language of Mexico</p>
  </note>
</exercise>
```

## Guidelines

1. **Clear statements**: Each statement should be definitively true or false
2. **Avoid negatives**: Don't use confusing double negatives
3. **Balance**: Include roughly equal numbers of true and false statements
4. **Explanations**: In teacher notes, explain WHY false statements are false
5. **Based on content**: For reading exercises, statements should be verifiable from the text
6. **Avoid tricks**: Don't try to trick students with misleading wording

## Statement Types

### Good Statements

- **Factual claims**: Verifiable facts
- **Text-based**: Can be confirmed from reading material
- **Clear language**: Unambiguous meaning

### Bad Statements

- **Opinion-based**: "Pizza is delicious" (subjective)
- **Partially true**: "All birds can fly" (penguins can't)
- **Ambiguous**: "The weather is nice" (depends on preference)

## CEFR Level Guidelines

### A1-A2

- Simple, concrete statements
- Basic vocabulary
- Obviously true or obviously false
- Related to everyday topics

### B1-B2

- More abstract concepts
- Requires understanding of nuance
- May require inference
- Can include technical vocabulary

### C1-C2

- Complex statements
- Subtle distinctions
- May involve interpretation
- Sophisticated vocabulary

## Example: Good vs Bad

**Good:**

```xml
<p>According to the text, the company was founded in 1995.</p>
```

Can be verified directly from the reading passage.

**Bad:**

```xml
<p>The company is successful.</p>
```

"Successful" is subjective and may not be clearly stated in the text.
