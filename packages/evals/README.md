# Exercise Evaluation System

Standalone CLI for testing exercise generation using Vercel AI Gateway.

## Usage

### Run all tests

```bash
pnpm evals:run --all --output results.json
```

### Run specific test

```bash
pnpm evals:run --case fill-blanks/a2/1
```

### Run by type

```bash
pnpm evals:run --type fill-blanks
```

### Test agent directly

```bash
pnpm evals:agent --fixture a2-daily-routine --instruction "Create fill-in-the-blank exercise"
```

### Score a result

```bash
pnpm evals:score --result result.json --case fill-blanks/a2/1
```

## Configuration

Create `.env.local` with your API key:

```
AI_GATEWAY_API_KEY=your-key-here
```

## Test Cases

Test cases are in `cases/` directory, organized by exercise type.
XML fixtures are in `fixtures/xml/`.

## Deprecated Files (for reference)

- `promptfooconfig.yaml` - Legacy configuration for promptfoo testing framework
- `providers/` - Legacy provider implementations (no longer used)
- `scorers/` - Legacy scoring implementations, replaced by `src/scoring/`
