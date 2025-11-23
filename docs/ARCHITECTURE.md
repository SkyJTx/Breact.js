# Breact.js Architecture

## Overview

Breact.js is a React-like framework built for Bun with a clear separation between Component lifecycle and reactive state management through Hooks.

## Core Concepts

### 1. Component Lifecycle (Class-based)

Components are **stateless** classes that describe what to render. They have a minimal lifecycle:

```typescript
abstract class Component {
  // Called once when component is mounted to the DOM/SSR tree
  onMount(context: BuildContext): void {}
  
  // Called when component is removed from the tree
  onUnmount(context: BuildContext): void {}
  
  // Required: returns the component's children
  abstract render(context: BuildContext): Child;
}
```

**Use lifecycle methods for:**

- Setting up external resources (WebSocket connections, intervals, etc.)
- Cleanup when component is removed
- **NOT for reactive state** - use Hooks instead!

### 2. Hooks (Reactive State)

Hooks provide **reactive state management** inside the `render()` method:

```typescript
class Counter extends Component {
  render(context: BuildContext) {
    const [count, setCount] = useState(0);
    
    useEffect(() => {
      console.log(`Count is now: ${count}`);
      return () => console.log('Cleanup');
    }, [count]);
    
    return new HTMLComponent('button', {
      onClick: () => setCount(count + 1)
    }, [`Count: ${count}`]);
  }
}
```

**Use Hooks for:**

- Component state that triggers re-renders (`useState`)
- Side effects with dependency tracking (`useEffect`)
- Reactive logic tied to render cycles

### 3. Element Tree (Framework Internal)

The Element tree is an **internal implementation detail** that you rarely interact with directly:

```typescript
abstract class Element {
  component: Component;
  children: Element[];
  context: BuildContext;
  
  abstract mount(parent: any): void;
  abstract unmount(): void;
  abstract markNeedsBuild(): void;
  abstract performRebuild(): void;
}
```

**Elements handle:**

- DOM/Virtual DOM representation
- Reconciliation and updates
- Hook state storage
- Render scheduling

## Architecture Layers

```
┌─────────────────────────────────────┐
│     Your Components (extend)        │  ← You write these
│  - render() method                  │
│  - Uses hooks for state             │
│  - Optional lifecycle methods       │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│     Element Tree (framework)        │  ← Framework manages this
│  - DOMElement for browser           │
│  - SSRElement for server            │
│  - Manages hooks state              │
│  - Handles reconciliation           │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│     Native Output                   │  ← Result
│  - Real DOM (browser)               │
│  - HTML String (SSR)                │
└─────────────────────────────────────┘
```

## Why This Design?

### Clear Separation of Concerns

**Component Class** = Describes WHAT to render

- Stateless by default
- Simple lifecycle (mount/unmount)
- No confusing "update" methods

**Hooks** = HOW state changes over time

- Always called in render()
- Reactive and dependency-tracked
- Familiar to React developers

**Element Tree** = HOW rendering actually works

- Implementation detail
- Handles DOM updates
- Manages hook state

### No Redundancy

❌ **Old (Confusing):**

```typescript
// Two ways to do the same thing:
onInit() { /* setup */ }  // OR useEffect(() => {}, [])
onDepsUpdate() { /* update */ }  // What are "deps"?
onDispose() { /* cleanup */ }  // OR useEffect cleanup
```

✅ **New (Clear):**

```typescript
// Lifecycle: non-reactive setup/cleanup
onMount() { /* connect websocket */ }
onUnmount() { /* disconnect */ }

// Hooks: reactive state
render() {
  const [data, setData] = useState(null);
  useEffect(() => {
    // Runs when dependencies change
    return () => { /* cleanup */ };
  }, [dependency]);
}
```

## Common Patterns

### 1. Simple Stateless Component

```typescript
class Greeting extends Component {
  name: string;
  
  constructor(name: string) {
    super();
    this.name = name;
  }
  
  render(_context: BuildContext) {
    return new HTMLComponent('h1', {}, [`Hello, ${this.name}!`]);
  }
}
```

### 2. Stateful Component with Hooks

```typescript
class Counter extends Component {
  render(_context: BuildContext) {
    const [count, setCount] = useState(0);
    
    return new HTMLComponent('div', {}, [
      new HTMLComponent('p', {}, [`Count: ${count}`]),
      new HTMLComponent('button', {
        onClick: () => setCount(count + 1)
      }, ['Increment'])
    ]);
  }
}
```

### 3. Component with External Resources

```typescript
class WebSocketComponent extends Component {
  ws: WebSocket | null = null;
  
  onMount(_context: BuildContext) {
    // Non-reactive setup
    this.ws = new WebSocket('ws://...');
  }
  
  onUnmount(_context: BuildContext) {
    // Cleanup
    this.ws?.close();
  }
  
  render(_context: BuildContext) {
    const [messages, setMessages] = useState<string[]>([]);
    
    useEffect(() => {
      // Reactive listener setup
      const handler = (e: MessageEvent) => {
        setMessages(prev => [...prev, e.data]);
      };
      this.ws?.addEventListener('message', handler);
      
      return () => {
        this.ws?.removeEventListener('message', handler);
      };
    }, []);
    
    return new HTMLComponent('ul', {}, 
      messages.map(msg => new HTMLComponent('li', {}, [msg]))
    );
  }
}
```

## When to Use What?

| Use Case | Solution | Why |
|----------|----------|-----|
| Component needs state | `useState` | Reactive, triggers re-renders |
| Run code on every render | Just put it in `render()` | Simple |
| Run code when deps change | `useEffect(fn, deps)` | Reactive with cleanup |
| Run code once on mount | `useEffect(fn, [])` | Runs once, can have cleanup |
| Setup external resource | `onMount()` | Non-reactive, guaranteed single call |
| Cleanup on unmount | `onUnmount()` | Non-reactive cleanup |

## Testing

The simplified lifecycle makes testing straightforward:

```typescript
test("component lifecycle", () => {
  let mounted = false;
  let unmounted = false;
  
  class TestComponent extends Component {
    override onMount() { mounted = true; }
    override onUnmount() { unmounted = true; }
    render() { return "test"; }
  }
  
  const element = render(new TestComponent(), container);
  expect(mounted).toBe(true);
  
  element.unmount();
  expect(unmounted).toBe(true);
});
```

## Migration from Old API

If you have code using the old lifecycle methods:

```typescript
// OLD ❌
class MyComponent extends Component {
  onInit() { /* setup */ }
  onDepsUpdate() { /* on every update */ }
  onComponentUpdate(old) { /* when replaced */ }
  onDispose() { /* cleanup */ }
}

// NEW ✅
class MyComponent extends Component {
  onMount() { /* setup - called once */ }
  onUnmount() { /* cleanup - called once */ }
  
  render() {
    // Use hooks for reactive logic
    useEffect(() => {
      // This runs when dependencies change
      return () => { /* cleanup */ };
    }, [deps]);
  }
}
```

## Summary

- **Components** are lightweight, stateless by default
- **Hooks** handle all reactive state and effects
- **Lifecycle methods** (onMount/onUnmount) are for non-reactive setup/cleanup only
- **Element tree** is internal - you don't need to think about it

This design eliminates confusion between Component methods and Hooks, making the framework easier to understand and use!
