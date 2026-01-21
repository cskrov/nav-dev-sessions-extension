# AGENTS.md

## Commands
- Install dependencies: `bun i`
- Build: `bun run build`
- Build dev (watch): `bun dev`
- Run unit tests: `bun test`
- Check types: `bun typecheck`
- Lint code: `bun lint`
- Lint and fix code: `bun lint --fix`

## Code style
- TypeScript strict mode
- No implicit boolean conversions
- No type coercion
- No single line if statements
- Use arrow functions for callbacks
- Use discriminated unions for type narrowing
- Avoid type casting
- Place helper functions after main functions
- Use early returns to reduce nesting
- Prefer ternary expression in TSX/JSX over guard and default operators
