# Sequencing Exercise Rules

## XML Structure

Sequencing exercises ask students to arrange items in the correct order:

```xml
<exercise id="ex-seq-123">
  <h3>Put the Steps in Order</h3>
  <p>Number the following steps in the correct order to make a cup of tea (1-5):</p>

  <p>___ Pour the hot water into the cup</p>
  <p>___ Add milk or sugar if desired</p>
  <p>___ Boil water in a kettle</p>
  <p>___ Place a tea bag in the cup</p>
  <p>___ Let the tea steep for 3-5 minutes</p>

  <note>
    <p>Correct order:</p>
    <ol>
      <li><p>Boil water in a kettle</p></li>
      <li><p>Place a tea bag in the cup</p></li>
      <li><p>Pour the hot water into the cup</p></li>
      <li><p>Let the tea steep for 3-5 minutes</p></li>
      <li><p>Add milk or sugar if desired</p></li>
    </ol>
  </note>
</exercise>
```

## Alternative: With Writing Areas

For interactive responses:

```xml
<exercise id="ex-seq-456">
  <h3>Story Sequence</h3>
  <p>Put the events from the story in chronological order. Write numbers 1-4:</p>

  <p><writing-area id="wa-s1" lines="1" placeholder="#"><p></p></writing-area> Maria arrived at the party.</p>
  <p><writing-area id="wa-s2" lines="1" placeholder="#"><p></p></writing-area> She received the invitation.</p>
  <p><writing-area id="wa-s3" lines="1" placeholder="#"><p></p></writing-area> Everyone sang "Happy Birthday."</p>
  <p><writing-area id="wa-s4" lines="1" placeholder="#"><p></p></writing-area> She bought a present for her friend.</p>

  <note>
    <p>Correct sequence: 3, 1, 4, 2</p>
    <p>(Invitation → Buy present → Arrive → Sing)</p>
  </note>
</exercise>
```

## Guidelines

1. **Clear logical order**: There should be one correct sequence
2. **5-8 items**: Include enough items to be challenging but not overwhelming
3. **Obvious clues**: Each item should have hints about its position
4. **Time/process focus**: Works best for chronological or procedural sequences
5. **Scramble well**: Present items in a non-obvious random order

## Sequencing Types

### Chronological

Events in time order (story events, historical events)

### Procedural

Steps in a process (recipes, instructions, how-to guides)

### Logical

Ideas that build on each other (arguments, explanations)

### Size/Degree

From smallest to largest, least to most, etc.

## CEFR Level Guidelines

### A1-A2

- Simple daily routines
- Basic processes (making food, getting ready)
- 4-5 items maximum
- Very clear sequence markers

### B1-B2

- More complex narratives
- Abstract sequences
- 5-7 items
- Some inference required

### C1-C2

- Complex arguments
- Subtle ordering
- 6-8 items
- May have multiple valid approaches (with explanation)

## Example: Good Sequence Design

**Good:**

```xml
<p>___ First, preheat the oven to 180°C.</p>
<p>___ Finally, let the cake cool before serving.</p>
<p>___ Then, mix all the dry ingredients together.</p>
<p>___ Next, add the wet ingredients and stir.</p>
<p>___ After that, pour the batter into the pan and bake for 30 minutes.</p>
```

Sequence words (first, then, next, after that, finally) provide hints.

**Bad:**

```xml
<p>___ Mix ingredients.</p>
<p>___ Bake.</p>
<p>___ Prepare.</p>
<p>___ Serve.</p>
```

Too vague, no context clues, items are not specific enough.
