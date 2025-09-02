# Package.json Scripts Update Required

Since package.json is read-only in Lovable, here's the required manual update for the scripts section:

## Current Scripts Section:
```json
"scripts": {
  "dev": "vite",
  "build": "vite build", 
  "build:dev": "vite build --mode development",
  "lint": "eslint .",
  "preview": "vite preview"
}
```

## Updated Scripts Section Needed:
```json
"scripts": {
  "dev": "vite",
  "build": "vite build",
  "build:dev": "vite build --mode development", 
  "lint": "eslint .",
  "preview": "vite preview",
  "test": "vitest",
  "test:run": "vitest run",
  "test:smoke": "vitest run tests/nav.smoke.test.ts",
  "precleanup:check": "npm run test:smoke && tsc --noEmit && npm run lint",
  "type-check": "tsc --noEmit"
}
```

## New Scripts Added:

- **`test`** - Run all tests in watch mode
- **`test:run`** - Run all tests once
- **`test:smoke`** - Run only the critical navigation smoke tests
- **`precleanup:check`** - Complete safety check before cleanup (smoke tests + TypeScript + ESLint)
- **`type-check`** - TypeScript validation without building

## Usage:

```bash
# Before any cleanup or dead code removal:
npm run precleanup:check

# Individual checks:
npm run test:smoke    # Critical component safety
npm run type-check    # TypeScript validation  
npm run lint         # Code quality check
```