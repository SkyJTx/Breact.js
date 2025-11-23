import { Element } from "./element";
import type { Router, RouteInfo } from "./router";

// Hooks System - Global state for current rendering context
let currentElement: Element | null = null;
let hookIndex = 0;

// Context for router hooks
interface RouterContext {
  router?: Router;
  route?: RouteInfo | null;
}

let currentRouterContext: RouterContext = {};

export function setActiveElement(el: Element | null) {
  currentElement = el;
  hookIndex = 0;
}

export function getActiveElement(): Element {
  if (!currentElement)
    throw new Error(
      "Hook called outside of render(). Hooks such as useState() must be invoked during Component.render(), setup(), or another hook."
    );
  return currentElement;
}

export function getHookState(): unknown[] {
  const el = getActiveElement() as { hooks?: unknown[] };
  if (!el.hooks) el.hooks = [];
  return el.hooks;
}

export function getHookIndex(): number {
  return hookIndex++;
}

export function setRouterContext(router: Router, route: RouteInfo | null) {
  currentRouterContext = { router, route };
}

export function getRouterContext(): RouterContext {
  return currentRouterContext;
}

// ============================================================================
// Core Hooks
// ============================================================================

export function useState<T>(
  initialValue: T
): [T, (val: T | ((prev: T) => T)) => void] {
  const el = getActiveElement();
  const hooks = getHookState() as T[];
  const idx = getHookIndex();

  if (hooks.length <= idx) {
    hooks[idx] = initialValue;
  }

  const setState = (val: T | ((prev: T) => T)) => {
    const currentValue = hooks[idx] as T;
    const newValue = val instanceof Function ? val(currentValue) : val;
    if (currentValue !== newValue) {
      hooks[idx] = newValue;
      el.markNeedsBuild();
    }
  };

  return [hooks[idx] as T, setState];
}

interface WatchHook {
  deps?: unknown[];
  effect: () => void | (() => void);
  cleanup?: () => void;
  pending: boolean;
}

// useWatch - Requires explicit dependencies (Vue-inspired)
export function useWatch(effect: () => void | (() => void), deps: unknown[]) {
  const hooks = getHookState() as WatchHook[];
  const idx = getHookIndex();

  const oldHook = hooks[idx];
  const hasChanged =
    !oldHook || !oldHook.deps || deps.some((d, i) => d !== oldHook.deps![i]);

  if (hasChanged) {
    hooks[idx] = { deps, effect, cleanup: oldHook?.cleanup, pending: true };
  } else {
    hooks[idx] = oldHook;
  }
}

// useWatchEffect - Auto-tracks dependencies (runs on every render)
export function useWatchEffect(effect: () => void | (() => void)) {
  const hooks = getHookState() as WatchHook[];
  const idx = getHookIndex();

  const oldHook = hooks[idx];
  // Always run on every render (auto-tracking behavior)
  hooks[idx] = { effect, cleanup: oldHook?.cleanup, pending: true };
}

// Legacy alias for backwards compatibility
export const useEffect = useWatch;

// ============================================================================
// Router Hooks
// ============================================================================

export function useRoute<
  TParams = Record<string, unknown>
>(): RouteInfo<TParams> {
  const { route } = getRouterContext();
  if (!route) {
    throw new Error("useRoute() must be called within a RouterComponent");
  }
  return route as RouteInfo<TParams>;
}

export interface RouterNavigation {
  push(path: string): void;
  replace(path: string): void;
  back(): void;
  forward(): void;
  getCurrentPath(): string;
}

export function useRouter(): RouterNavigation {
  const { router } = getRouterContext();
  if (!router) {
    throw new Error("useRouter() must be called within a RouterComponent");
  }

  return {
    push: (path: string) => {
      // Navigation logic will be implemented by RouterComponent
      if (typeof window !== "undefined") {
        window.history.pushState({}, "", path);
        window.dispatchEvent(new PopStateEvent("popstate"));
      }
    },
    replace: (path: string) => {
      if (typeof window !== "undefined") {
        window.history.replaceState({}, "", path);
        window.dispatchEvent(new PopStateEvent("popstate"));
      }
    },
    back: () => {
      if (typeof window !== "undefined") {
        window.history.back();
      }
    },
    forward: () => {
      if (typeof window !== "undefined") {
        window.history.forward();
      }
    },
    getCurrentPath: () => {
      if (typeof window !== "undefined") {
        return window.location.pathname;
      }
      return "/";
    },
  };
}
