# Breact.js

A full-stack framework using **Bun** as the runtime, **TypeScript**, **Elysia.js** for the backend, and a custom React-like frontend framework.

## Quick Start

### Installation

```bash
npm install @skyjt/breact
```

Or with bun:

```bash
bun add @skyjt/breact
```

### Create a new project

```bash
# Always use latest version to avoid cache issues
bunx --latest @skyjt/breact my-app example
cd my-app
bun install
bun run dev
```

Or specify version explicitly:

```bash
bunx @skyjt/breact@latest my-app example
```

### For local development

```bash
bun link
bunx @skyjt/breact my-app example
cd my-app
bun install
bun link @skyjt/breact
bun run dev
```

## Troubleshooting

### "Cannot find module 'breact.js'" error

If you see this error in a generated project, you may have created it with an older version (< 0.1.4). Solutions:

1. **Create a fresh project** with the latest version:

   ```bash
   bunx --latest @skyjt/breact.js my-new-app example
   ```

2. **Update existing project** - Replace all imports from `'breact.js'` to `'@skyjt/breact.js'`:

   ```typescript
   // Old (< v0.1.4)
   import { Component } from 'breact.js';
   
   // New (>= v0.1.4)
   import { Component } from '@skyjt/breact.js';
   ```

3. **Clear bunx cache** if you still get the old version:

   ```bash
   # On Windows
   Remove-Item -Recurse -Force $env:LOCALAPPDATA\Temp\bunx-*
   
   # On macOS/Linux
   rm -rf ~/.bun/install/cache/
   ```

## Features

- **React-like Hooks API** with automatic dependency tracking
- **Component Tree → Element Tree → DOM Tree** architecture
- **Server & Client Components** with decorators
- **No Virtual DOM** - Direct efficient DOM reconciliation
- **Unified Router** for CSR and SSR
- **Full Generic Type Support** - Type-safe props, state, routes, and context
- **Elysia.js** backend with Swagger docs
- **Bun runtime** with hot reload support

## Building

```bash
# Type check
bun run check

# Build for distribution
bun run build

# Build library only
bun run build:lib

# Build CLI only
bun run build:cli
```

## Publishing to npm

After building:

```bash
npm publish dist/
```

## Project Structure

`
src/
├── shared/         # Framework core
│   ├── framework.ts
│   ├── router.ts
│   └── index.ts
├── client/         # Client rendering
│   ├── dom.ts
│   └── index.ts
├── server/         # Server setup
│   ├── index.ts
│   ├── ssr.ts
│   └── index.ts
└── cli/            # Scaffolding
    └── index.ts

index.ts           # Main entry point
build.ts           # Build script
`

## Documentation

- **[Generic Type Support Guide](./docs/GENERICS.md)** - Complete guide to type-safe development
- Comprehensive examples available in generated projects using `bunx @skyjt/breact`

## License

MIT
