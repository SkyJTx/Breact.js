import type { Child, StyleDefinition, StyleProcessor } from "./types";
import { BuildContext } from "./context";

export abstract class Component {
  key?: string | number;

  constructor(key?: string | number) {
    this.key = key;
  }

  // Core lifecycle - called when component is first created (protected - called by framework)
  protected onMount(_context: BuildContext): void {
    // Override in subclass if needed
  }

  // Called when component is being replaced/removed (protected - called by framework)
  protected onUnmount(_context: BuildContext): void {
    // Override in subclass if needed
  }

  // Main render method - override in subclass
  // Can use hooks here (useState, useEffect, etc.)
  render(_context: BuildContext): Child {
    return null;
  }

  // Public API for Element implementations to trigger lifecycle
  /** @internal - Called by Element implementations only */
  _triggerMount(context: BuildContext): void {
    this.onMount(context);
  }

  /** @internal - Called by Element implementations only */
  _triggerUnmount(context: BuildContext): void {
    this.onUnmount(context);
  }

  // Helper to identify server/client components
  static isServer: boolean = false;
  static isClient: boolean = false;

  // Style definition for the component
  static style?: StyleDefinition;
  static styleProcessors: Map<string, StyleProcessor> = new Map();
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

  override render(_context: BuildContext): Child {
    return this.children;
  }
}
