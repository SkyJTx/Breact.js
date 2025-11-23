# Lifecycle Methods vs Hooks: Design Rationale

## The Dual System Explained

Breact implements **both** class lifecycle methods (`onMount`/`onUnmount`) **and** composition hooks (`onMounted`/`onUnmounted`). This might seem redundant, but it's an intentional design pattern that provides both flexibility and composability.

## Architecture Layers

```
┌─────────────────────────────────────────────────┐
│          Framework Layer (Internal)             │
│                                                 │
│  Element.mount() → Component.onMount(context)   │
│                    ├─ Execute setup()           │
│                    ├─ Run onMounted callbacks   │
│                    └─ Initialize component      │
└─────────────────────────────────────────────────┘
                         ↓
┌─────────────────────────────────────────────────┐
│          User Layer (Public API)                │
│                                                 │
│  setup(context) {                               │
│    context.onMounted(() => { ... });            │
│    context.onUnmounted(() => { ... });          │
│  }                                              │
└─────────────────────────────────────────────────┘
```

## Why Both?

### 1. **Separation of Concerns**

**Framework Methods** (`onMount`/`onUnmount`):

- Called **by the framework** (Element implementations)
- Orchestrate the component initialization process
- Execute setup() and manage callback queues
- Can be overridden for **framework-level** customization

**User Hooks** (`onMounted`/`onUnmounted`):

- Called **by component authors** in setup()
- Declarative, composable callback registration
- Multiple callbacks can be registered
- **Application-level** logic

### 2. **Composability vs. Override**

```typescript
// ❌ Problem with only override-based lifecycle:
class Counter extends Component {
  override onMount(context: BuildContext) {
    // If you override, you lose framework behavior
    // unless you remember to call super.onMount()
    console.log('Mounted!');
  }
}

// ✅ Solution with hooks:
class Counter extends Component {
  setup(context: SetupContext) {
    // Multiple independent concerns can register callbacks
    context.onMounted(() => console.log('Mounted!'));
    context.onMounted(() => startTimer());
    context.onMounted(() => fetchData());
    
    // Each returns optional cleanup
    context.onMounted(() => {
      const interval = setInterval(() => {}, 1000);
      return () => clearInterval(interval); // Cleanup!
    });
  }
}
```

### 3. **Similar Patterns in Other Frameworks**

#### React

```typescript
// Class Component (framework lifecycle)
class Counter extends React.Component {
  componentDidMount() {
    // Framework calls this
  }
}

// Functional Component (user hooks)
function Counter() {
  useEffect(() => {
    // User calls this
    return () => {}; // cleanup
  }, []);
}
```

#### Vue 3

```typescript
// Options API (framework lifecycle)
export default {
  mounted() {
    // Framework calls this
  }
}

// Composition API (user hooks)
export default {
  setup() {
    onMounted(() => {
      // User calls this
    });
  }
}
```

## Execution Order

```
1. Component instance created
   new Counter()
   
2. Framework calls onMount()
   Component.onMount(context)
   
3. Framework executes setup()
   if (this.setup) {
     const setupContext = { onMounted, onUnmounted };
     this._setupResult = this.setup(setupContext);
   }
   
4. User registers callbacks
   context.onMounted(() => console.log('A'));
   context.onMounted(() => console.log('B'));
   
5. Framework executes all callbacks
   this._mountedCallbacks.forEach(callback => {
     const cleanup = callback();
     if (typeof cleanup === 'function') {
       this._cleanupCallbacks.push(cleanup);
     }
   });
   
   // Output:
   // "A"
   // "B"
   
6. Render happens
   Component.render(context)
```

## Advanced Use Cases

### Case 1: Custom Element Behavior

```typescript
class CustomElement extends Element {
  override mount(parent: any) {
    // Custom mounting logic
    this.component.onMount(this.context); // Call component lifecycle
    // More custom logic
  }
}
```

### Case 2: Middleware/Plugin System

```typescript
class PluginComponent extends Component {
  override onMount(context: BuildContext) {
    // Run plugins before setup
    this.runPlugins('beforeSetup');
    
    // Execute standard lifecycle
    super.onMount(context);
    
    // Run plugins after setup
    this.runPlugins('afterSetup');
  }
}
```

### Case 3: Debugging/Profiling

```typescript
class ProfiledComponent extends Component {
  override onMount(context: BuildContext) {
    console.time('mount');
    super.onMount(context);
    console.timeEnd('mount');
  }
  
  setup(context: SetupContext) {
    // User code - unaware of profiling
    context.onMounted(() => {
      console.log('User callback');
    });
  }
}
```

## When to Use Which?

### Use `onMount()`/`onUnmount()` override when

- Building **framework extensions** or plugins
- Implementing **custom Element** classes
- Need to **intercept** the lifecycle process
- Working on **framework-level** features

### Use `onMounted()`/`onUnmounted()` hooks when

- Building **application components**
- Need **multiple independent** lifecycle callbacks
- Want **composable** logic (mixins, hooks reuse)
- Need **cleanup functions**
- Following **Vue 3 Composition API** patterns

## Benefits of This Design

### ✅ Backward Compatibility

- Old code can still override `onMount()`
- New code can use `setup()` with hooks

### ✅ Flexibility

- Framework developers can hook into lifecycle
- App developers get clean, declarative API

### ✅ Composability

- Multiple `onMounted()` callbacks can coexist
- Logic can be extracted into reusable functions

### ✅ Cleanup Management

- Built-in support for cleanup functions
- No manual tracking of subscriptions/timers

### ✅ Type Safety

- SetupContext provides strong typing
- IDE autocomplete for lifecycle hooks

## Example: Composable Logic

```typescript
// Reusable composable
function useWindowSize() {
  const [size, setSize] = useState({ width: 0, height: 0 });
  
  // Get current context
  const element = getActiveElement();
  const hooks = getHookState();
  
  // Register via current setup context
  // (In real implementation, this would be passed down)
  onMounted(() => {
    const updateSize = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };
    
    updateSize();
    window.addEventListener('resize', updateSize);
    
    // Cleanup function
    return () => window.removeEventListener('resize', updateSize);
  });
  
  return size;
}

// Usage in component
class MyComponent extends Component {
  setup(context: SetupContext) {
    const windowSize = useWindowSize(); // Composable!
    
    return () => h('div', {}, [
      `Window: ${windowSize.width}x${windowSize.height}`
    ]);
  }
}
```

## Summary

The dual system provides:

1. **Framework layer** - `onMount()`/`onUnmount()` for orchestration
2. **User layer** - `onMounted()`/`onUnmounted()` for composition

This separation enables both **powerful framework extensions** and **elegant application code**, following proven patterns from React and Vue while maintaining Breact's unique architecture.
