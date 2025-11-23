// Core type definitions

// Forward declaration to avoid circular dependency
export interface Component {
  key?: string | number;
  render(context: BuildContext): Child;
}

export type Child = Component | string | number | null | undefined | Child[];

// Style processing types
export type StyleDefinition = string | (() => string);
export type StyleProcessor = (style: string) => string;

// Build context interface
export interface BuildContext {
  get<T>(type: unknown): T | undefined;
  readonly isHydrated: boolean;
}
