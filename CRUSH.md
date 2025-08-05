# CRUSH.md

Project overview: mono-repo with two Mastra TypeScript agents: line-agent/ and check-subsidy-agent/. Node >=20.9. Uses TypeScript, ESM ("type": "module"). No test suite configured yet.

Build/dev/run
- Install: npm i in each package dir
- Dev server: npm run dev (hot-reload via Mastra)
- Build: npm run build (mastra build)
- Start: npm start (mastra start)

Lint/format/typecheck
- Typecheck: npx tsc -p tsconfig.json
- Lint: none configured; recommend npx eslint . if added later
- Format: none configured; prefer Prettier defaults if added later

Testing
- No tests configured. Recommend: npm i -D vitest @types/node tsx; then add scripts: { "test": "vitest", "test:watch": "vitest -w", "test:file": "vitest run -t" }
- Single test example (once configured): npx vitest run path/to/file.test.ts -t "test name"

Code style
- Imports: ESM, absolute from package or relative with extensions omitted; group: std libs, external deps, internal (with blank lines between)
- Formatting: 2-space indent, semicolons, single quotes, trailing commas where valid
- Types: enable strict; prefer explicit types for public APIs; use zod for schema validation as repo already uses zod
- Naming: camelCase for vars/functions, PascalCase for types/classes, UPPER_SNAKE_CASE for const env keys
- Errors: never swallow; return Result-like or throw with Error; avoid logging secrets; centralize error messages
- Env/secrets: use process.env; do not commit keys; .mastra output may include local artifacts—do not rely on them in code

Mastra
- Workflows in src/mastra/workflows; entry in src/mastra/index.ts
- Use mastra CLI via scripts above; database via @mastra/libsql (sqlite/libsql)
