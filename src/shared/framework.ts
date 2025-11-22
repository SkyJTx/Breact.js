export type Child = Component | string | number | null | undefined | Child[];

export abstract class BuildContext {
  abstract get<T>(type: any): T | undefined;
  abstract get isHydrated(): boolean;
}

export abstract class Component {
  key?: string | number;

  constructor(key?: string | number) {
    this.key = key;
  }

  onInit(_context: BuildContext): void {}
  onDepsUpdate(_context: BuildContext): void {}

  abstract render(context: BuildContext): Child;

  onComponentUpdate(_oldComponent: Component): void {}
  onDispose(_context: BuildContext): void {}

  // Helper to identify server/client components
  static isServer: boolean = false;
  static isClient: boolean = false;
}

export abstract class Element {
  component: Component;
  parent?: Element;
  children: Element[] = [];
  context: BuildContext;
  dirty: boolean = true;

  constructor(component: Component) {
    this.component = component;
    // Context will be assigned by the renderer/parent
    this.context = null as any;
  }

  abstract mount(parentNativeNode: any): void;
  abstract update(newComponent: Component): void;
  abstract unmount(): void;
  abstract markNeedsBuild(): void;
  abstract performRebuild(): void;
}

// Hooks System
let currentElement: Element | null = null;
let hookIndex = 0;

export function setActiveElement(el: Element | null) {
  currentElement = el;
  hookIndex = 0;
}

export function getActiveElement(): Element {
  if (!currentElement) throw new Error("Hook called outside of render");
  return currentElement;
}

export function getHookState(): any {
  const el = getActiveElement() as any;
  if (!el.hooks) el.hooks = [];
  return el.hooks;
}

export function getHookIndex(): number {
  return hookIndex++;
}

export function useState<T>(
  initialValue: T
): [T, (val: T | ((prev: T) => T)) => void] {
  const el = getActiveElement();
  const hooks = getHookState();
  const idx = getHookIndex();

  if (hooks.length <= idx) {
    hooks[idx] = initialValue;
  }

  const setState = (val: T | ((prev: T) => T)) => {
    const newValue = val instanceof Function ? (val as any)(hooks[idx]) : val;
    if (hooks[idx] !== newValue) {
      hooks[idx] = newValue;
      el.markNeedsBuild();
    }
  };

  return [hooks[idx], setState];
}

export function useEffect(effect: () => void | (() => void), deps?: any[]) {
  const hooks = getHookState();
  const idx = getHookIndex();

  const oldHook = hooks[idx];
  const hasChanged =
    !oldHook ||
    !deps ||
    !oldHook.deps ||
    deps.some((d, i) => d !== oldHook.deps[i]);

  if (hasChanged) {
    hooks[idx] = { deps, effect, cleanup: oldHook?.cleanup, pending: true };
  } else {
    hooks[idx] = oldHook;
  }
}

// Base class for HTML elements
export class HTMLComponent<
  TProps extends Record<string, any> = Record<string, any>
> extends Component {
  tag: string;
  props: TProps;
  children: Child[];

  constructor(
    tag: string,
    props: TProps = {} as TProps,
    children: Child[] = []
  ) {
    super((props as any).key);
    this.tag = tag;
    this.props = props;
    this.children = children;
  }

  render(_context: BuildContext): Child {
    return this.children;
  }
}

// Decorators for Server/Client Components
export function ServerComponent() {
  return function <T extends { new (...args: any[]): {} }>(constructor: T) {
    (constructor as any).isServer = true;
  };
}

export function ClientComponent() {
  return function <T extends { new (...args: any[]): {} }>(constructor: T) {
    (constructor as any).isClient = true;
  };
}
