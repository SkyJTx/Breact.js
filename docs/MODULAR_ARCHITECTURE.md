# Framework Modular Architecture

## Overview

The Breact framework has been reorganized into a modular structure for better maintainability, code organization, and separation of concerns.

## File Structure

```
src/shared/
├── framework.ts      # Main entry point (re-exports all modules)
├── types.ts          # Type definitions and interfaces
├── context.ts        # BuildContext abstraction
├── component.ts      # Component base class and HTMLComponent
├── element.ts        # Element abstraction for rendering
├── hooks.ts          # Hooks system (useState, useEffect, useRoute, useRouter)
├── decorators.ts     # Component decorators (@css, @scss, @sass)
└── router.ts         # Router and RouterComponent
```

## Module Descriptions

### `types.ts` - Core Type Definitions

**Purpose**: Centralized type definitions used across the framework

**Exports**:

- `Child`: Union type for renderable content
- `SetupContext`: Interface for setup() lifecycle hooks
- `StyleDefinition`: Type for component styles
- `StyleProcessor`: Type for style transformation functions

### `context.ts` - Build Context

**Purpose**: Dependency injection and hydration state management

**Exports**:

- `BuildContext`: Abstract class for providing services and state to components during rendering

**Responsibilities**:

- Service locator pattern via `get<T>(type)`
- Hydration state tracking via `isHydrated`

### `component.ts` - Component Base Classes

**Purpose**: Core component abstractions and HTML component implementation

**Exports**:

- `Component`: Abstract base class for all components
- `HTMLComponent`: Built-in component for HTML elements

**Key Features**:

- Vue-like `setup()` method support
- Lifecycle methods: `onMount()`, `onUnmount()`
- Setup callbacks: `onMounted()`, `onUnmounted()` (via SetupContext)
- Render method with default implementation
- Component metadata (isServer, isClient, style, styleProcessors)

### `element.ts` - Element Abstraction

**Purpose**: Abstract representation of rendered components in the tree

**Exports**:

- `Element`: Abstract class for DOM/SSR element implementations

**Responsibilities**:

- Component-to-native-node mapping
- Tree structure management (parent, children)
- Lifecycle management (mount, update, unmount)
- Rebuild scheduling (markNeedsBuild, performRebuild)
- Dirty state tracking

### `hooks.ts` - Hooks System

**Purpose**: React-like hooks for state management and side effects

**Exports**:

- **State Management**:
  - `useState<T>()`: State hook with re-render triggering
  - `useEffect()`: Side effect hook with dependency tracking
  
- **Router Hooks**:
  - `useRoute()`: Access current route information
  - `useRouter()`: Access router navigation methods

- **Internal Utilities**:
  - `setActiveElement()`, `getActiveElement()`: Current rendering context
  - `getHookState()`, `getHookIndex()`: Hook state management
  - `setRouterContext()`, `getRouterContext()`: Router context for hooks

**Architecture**:

```
Global State (per-render):
  - currentElement: Element | null
  - hookIndex: number
  - currentRouterContext: { router?, route? }

Per-Element State:
  - hooks: any[] (stored on element instance)
```

### `decorators.ts` - Component Decorators

**Purpose**: TypeScript decorators for component metadata

**Exports**:

- `@ServerComponent()`: Mark component for server-side only rendering
- `@ClientComponent()`: Mark component for client-side only rendering
- `@css()`: Add CSS processing to component
- `@scss()`: Add SCSS processing to component (stub)
- `@sass()`: Add SASS processing to component (stub)

**Usage**:

```typescript
@css()
class MyComponent extends Component {
  static style = `
    .my-component { color: blue; }
  `;
}
```

## Lifecycle Flow

### Component Initialization & Mounting

```
1. Component constructor called
   ├─> key assigned

2. Element.mount() called by renderer
   ├─> Component.onMount(context) called
       ├─> setup() executed (if defined)
       │   ├─> SetupContext provided with onMounted/onUnmounted
       │   ├─> User registers callbacks
       │   └─> Returns render function or data
       │
       ├─> All onMounted() callbacks executed
       │   └─> Cleanup functions collected
       │
       └─> Component fully initialized

3. Component.render(context) called
   ├─> If setup() returned function, use it
   └─> Otherwise, use overridden render() method
```

### Why Both onMount() and onMounted()?

**Two-Tier Lifecycle System**:

1. **`onMount(context: BuildContext)` - Framework Lifecycle**
   - Called **by the framework** (Element implementation)
   - Can be **overridden** for advanced component behavior
   - Handles setup() execution and callback orchestration
   - **Single override** per component class

2. **`onMounted(() => void | (() => void))` - User Lifecycle Hook**
   - Called **by component authors** inside setup()
   - **Declarative** callback registration
   - **Multiple callbacks** can be registered (composable)
   - Returns optional cleanup function

**Example**:

```typescript
class MyComponent extends Component {
  // User-facing API (Vue-like)
  setup(context: SetupContext) {
    const [count, setCount] = useState(0);
    
    // Register multiple lifecycle hooks
    context.onMounted(() => {
      console.log('First callback');
      return () => console.log('First cleanup');
    });
    
    context.onMounted(() => {
      console.log('Second callback');
    });
    
    return () => h('div', {}, [count]);
  }
  
  // Advanced: Override framework lifecycle if needed
  override onMount(ctx: BuildContext) {
    super.onMount(ctx); // Execute setup() and callbacks
    // Custom initialization logic
  }
}
```

**Benefits**:

- **Flexibility**: Override `onMount()` for advanced cases
- **Composability**: Multiple `onMounted()` callbacks
- **Separation**: Framework concerns vs user concerns
- **Cleanup**: Built-in cleanup function support

## Hook Rules

1. **Call hooks at the top level** - Don't call inside loops, conditions, or nested functions
2. **Call hooks in consistent order** - Hook index must be stable across renders
3. **Active element required** - Hooks must be called during:
   - `Component.render()`
   - `setup()` method
   - Another hook

## Router Integration

The router system integrates with hooks via context:

```typescript
class MyPage extends Component {
  setup(context: SetupContext) {
    const route = useRoute();        // Get current route
    const router = useRouter();      // Get navigation methods
    
    return () => h('div', {}, [
      `Current path: ${route.path}`,
      h('button', {
        onclick: () => router.push('/about')
      }, ['Go to About'])
    ]);
  }
}
```

**Router Context Flow**:

1. `RouterComponent.render()` calls `setRouterContext(router, route)`
2. Child components call `useRoute()` or `useRouter()`
3. Hooks access context via `getRouterContext()`

## Migration from Old API

### Before (Class-based with override)

```typescript
class Counter extends Component {
  private count = 0;
  
  override render(context: BuildContext) {
    return h('div', {}, [
      `Count: ${this.count}`,
      h('button', {
        onclick: () => {
          this.count++;
          // Manual re-render trigger needed
        }
      }, ['Increment'])
    ]);
  }
}
```

### After (Vue-like setup)

```typescript
class Counter extends Component {
  setup(context: SetupContext) {
    const [count, setCount] = useState(0);
    
    context.onMounted(() => {
      console.log('Counter mounted!');
    });
    
    return () => h('div', {}, [
      `Count: ${count}`,
      h('button', {
        onclick: () => setCount(c => c + 1)
      }, ['Increment'])
    ]);
  }
}
```

## Design Patterns

### 1. Service Locator (BuildContext)

- Components request services via `context.get<T>(type)`
- Decouples components from concrete implementations

### 2. Virtual DOM (Element abstraction)

- Element represents rendered component in tree
- Reconciliation via update() method
- Platform-agnostic rendering

### 3. Hooks Pattern (useState, useEffect)

- Functional approach to state and lifecycle
- Similar to React hooks
- Stateful logic without classes

### 4. Composition API (setup method)

- Vue 3-inspired design
- Logic composition and reuse
- TypeScript-friendly

## Testing

All modules are tested via integration tests in `tests/unit/`:

- `component.test.ts` - Component lifecycle and rendering
- `hooks.test.ts` - Hook behavior and state management
- `element.test.ts` - Element tree operations
- `router.test.ts` - Routing and navigation
- `rendering.test.ts` - DOM rendering
- `server.test.ts` - Server integration
- `ssr.test.ts` - Server-side rendering

## Future Extensions

### Potential Additional Modules

- `animations.ts` - Animation system
- `transitions.ts` - Component transitions
- `suspense.ts` - Async component loading
- `teleport.ts` - Portal/teleport rendering
- `directives.ts` - Custom directives system
