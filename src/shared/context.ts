import type { BuildContext as IBuildContext } from "./types";

// Build context abstraction for dependency injection and hydration state
export abstract class BuildContext implements IBuildContext {
  abstract get<T>(type: unknown): T | undefined;
  abstract get isHydrated(): boolean;
}
