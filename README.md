# Breact.js

A full-stack framework using **Bun** as the runtime, **TypeScript**, **Elysia.js** for the backend, and a custom React-like frontend framework.

## Quick Start

### Build the library

```bash
bun run build
```

### Link for local development

```bash
bun link
```

### Create a new project

```bash
bunx create-breact-app my-app example
cd my-app
bun install
bun link breact.js
bun run dev
```

## Features

- **React-like Hooks API** with automatic dependency tracking
- **Component Tree → Element Tree → DOM Tree** architecture
- **Server & Client Components** with decorators
- **No Virtual DOM** - Direct efficient DOM reconciliation
- **Unified Router** for CSR and SSR
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

```
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
```

## Documentation

Comprehensive documentation and examples are available in generated projects using `bunx create-breact-app`.

## License

MIT
