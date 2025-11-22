# Generic Type Support in Breact.js

Breact.js v0.1.4+ provides comprehensive generic type support for type-safe development.

## Core Framework Generics

### 1. BuildContext.get<T>()

Type-safe context value retrieval:

```typescript
abstract class BuildContext {
  abstract get<T>(type: any): T | undefined;
}

// Usage
const theme = context.get<ThemeConfig>(ThemeConfig);
const user = context.get<User>(UserService);
```

### 2. useState<T>()

Type-safe state management:

```typescript
export function useState<T>(
  initialValue: T
): [T, (val: T | ((prev: T) => T)) => void];

// Usage
const [count, setCount] = useState<number>(0);
const [user, setUser] = useState<User | null>(null);
const [items, setItems] = useState<string[]>([]);

// Type inference works automatically
const [name, setName] = useState("Alice"); // Inferred as string
```

### 3. HTMLComponent<TProps>

Type-safe HTML component props:

```typescript
export class HTMLComponent<
  TProps extends Record<string, any> = Record<string, any>
> extends Component {
  tag: string;
  props: TProps;
  children: Child[];
}

// Usage with typed props
interface ButtonProps {
  onclick: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
}

const button = new HTMLComponent<ButtonProps>('button', {
  onclick: () => console.log('clicked'),
  variant: 'primary'
}, ['Click Me']);

// Default usage (untyped props)
const div = new HTMLComponent('div', { style: { color: 'red' } }, ['Content']);
```

## Router Generics

### 4. Route<TParams>

Type-safe route parameters:

```typescript
export type Route<TParams = any> = {
  path: string;
  component: (params?: TParams) => Component;
};

// Usage
interface UserRouteParams {
  id: string;
  tab?: 'profile' | 'settings';
}

const userRoute: Route<UserRouteParams> = {
  path: '/user/:id',
  component: (params) => new UserPage(params?.id || '')
};
```

### 5. Router<TRoutes>

Type-safe router with route array inference:

```typescript
export class Router<TRoutes extends Route[] = Route[]> {
  routes: TRoutes;
  constructor(routes: TRoutes);
  match(path: string): Component | null;
}

// Usage
const routes = [
  { path: '/', component: () => new HomePage() },
  { path: '/about', component: () => new AboutPage() }
] as const;

const router = new Router(routes);
// TypeScript knows the exact route types
```

### 6. RouterComponent<TRouter>

Type-safe router component:

```typescript
export class RouterComponent<TRouter extends Router = Router> extends Component {
  router: TRouter;
  currentPath: string;
}

// Usage
const myRouter = new Router([...]);
const routerComponent = new RouterComponent(myRouter, '/');
// Type inference preserves router type
```

## Decorator Generics

### 7. @ClientComponent() / @ServerComponent()

Generic decorator support for any class:

```typescript
export function ClientComponent() {
  return function <T extends { new (...args: any[]): {} }>(constructor: T) {
    (constructor as any).isClient = true;
  };
}

// Usage - works with any component class
@ClientComponent()
export class MyComponent extends Component {
  render() { /* ... */ }
}
```

## Best Practices

### 1. Explicit Type Parameters

Use explicit generics when TypeScript can't infer:

```typescript
// Good - explicit when needed
const [data, setData] = useState<ApiResponse | null>(null);

// Good - inference works
const [count, setCount] = useState(0);
```

### 2. Typed Props Interfaces

Define interfaces for complex component props:

```typescript
interface CardProps {
  title: string;
  description?: string;
  onClick?: () => void;
  variant?: 'default' | 'outlined';
}

class Card extends Component {
  props: CardProps;
  
  constructor(props: CardProps) {
    super();
    this.props = props;
  }
  
  render() {
    return new HTMLComponent<CardProps>('div', this.props, [
      this.props.title
    ]);
  }
}
```

### 3. Route Type Safety

Use typed route params for complex routing:

```typescript
interface ProductParams {
  productId: string;
  category?: string;
}

const productRoute: Route<ProductParams> = {
  path: '/product/:productId',
  component: (params) => new ProductPage(params!.productId)
};
```

## Type Exports

All generic types are exported from the main package:

```typescript
import type {
  Child,
  BuildContext,
  Route,
  Component
} from '@skyjt/breact.js';
```

## Future Enhancements

Planned generic improvements:

- Typed event handlers in HTMLComponent
- Generic context providers with `Context<T>`
- Typed form state management
- Generic API client integration with Eden Treaty types
