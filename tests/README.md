# Breact.js Test Suite

This directory contains comprehensive unit tests for all major functionality of the Breact.js framework.

## Test Structure

```
tests/
└── unit/
    ├── component.test.ts    # Component lifecycle and rendering tests
    ├── element.test.ts      # Element creation, hierarchy, and lifecycle tests
    ├── hooks.test.ts        # Hook system tests (useState, useEffect)
    ├── rendering.test.ts    # Client-side DOM rendering tests
    ├── router.test.ts       # Router and routing tests
    ├── server.test.ts       # Server integration and Elysia tests
    └── ssr.test.ts          # Server-side rendering tests
```

## Running Tests

### Run all tests

```bash
bun test
```

### Run tests in watch mode

```bash
bun test:watch
```

### Run specific test file

```bash
bun test tests/unit/component.test.ts
```

### Run tests with coverage (if configured)

```bash
bun test --coverage
```

## Test Categories

### 1. Component Tests (`component.test.ts`)

- Component lifecycle methods (onInit, onDepsUpdate, onComponentUpdate, onDispose)
- Component keys and identification
- Component rendering (strings, numbers, arrays, nested components)
- HTMLComponent creation and props handling
- BuildContext functionality

### 2. Element Tests (`element.test.ts`)

- Element creation and initialization
- Element hierarchy (parent-child relationships)
- Element lifecycle (mount, update, unmount)
- Element state management
- Abstract element implementations
- Element tree traversal

### 3. Hooks Tests (`hooks.test.ts`)

- Hook context management
- useState hook functionality
- State updates and rebuilds
- useEffect hook functionality
- Effect dependencies and cleanup
- Multiple hooks handling
- Hook error handling

### 4. Rendering Tests (`rendering.test.ts`)

- DOMElement creation and mounting
- Native DOM node creation
- Props application (styles, events, attributes)
- Element updating and reconciliation
- Children reconciliation
- markNeedsBuild and rebuild scheduling

### 5. Router Tests (`router.test.ts`)

- Router creation and configuration
- Route matching (exact paths, case sensitivity)
- Route component factories
- RouterComponent rendering
- Navigation between routes
- 404 handling
- Edge cases (empty paths, trailing slashes, query parameters)

### 6. SSR Tests (`ssr.test.ts`)

- Server-side rendering basics
- Style object to CSS string conversion
- Component rendering in SSR context
- Hooks in SSR (useState, useEffect)
- SSR BuildContext
- Complex HTML structure rendering
- SSRElement lifecycle methods

### 7. Server Tests (`server.test.ts`)

- Elysia server setup
- SSR integration with Elysia
- API endpoints creation
- Middleware and hooks
- Error handling
- Static file serving
- Full SSR application setup
- Hybrid SSR/CSR setup

## Testing Guidelines

### Writing Tests

1. Use descriptive test names that explain what is being tested
2. Follow the Arrange-Act-Assert pattern
3. Keep tests focused on a single behavior
4. Use mock implementations when testing abstract classes
5. Clean up resources in test teardown when necessary

### Test Isolation

- Each test should be independent
- Use `beforeEach` to reset state when needed
- Avoid shared mutable state between tests

### Assertions

- Use specific assertions (toBe, toEqual, toContain, etc.)
- Test both positive and negative cases
- Verify error handling and edge cases

## Dependencies

- **bun:test** - Built-in Bun test runner
- **jsdom** - DOM implementation for Node.js (used in rendering tests)

## CI/CD Integration

Tests should be run in CI/CD pipelines before:

- Merging pull requests
- Publishing new versions
- Deploying to production

Example CI command:

```bash
bun install
bun run check
bun test
```

## Debugging Tests

### Run single test

```bash
bun test -t "should create element with component"
```

### Verbose output

```bash
bun test --verbose
```

### Debug with breakpoints

Use VS Code's JavaScript Debug Terminal or add `debugger` statements in test code.

## Coverage Goals

Aim for:

- **Statement Coverage**: > 80%
- **Branch Coverage**: > 75%
- **Function Coverage**: > 80%
- **Line Coverage**: > 80%

## Future Test Additions

- Integration tests for full application flows
- Performance benchmarks
- Browser compatibility tests
- E2E tests using Playwright or similar
- Load testing for server components
