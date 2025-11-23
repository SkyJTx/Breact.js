import type { Child, StyleDefinition, StyleProcessor } from "./types";
import { BuildContext } from "./context";

export abstract class Component {
  key?: string | number;

  constructor(key?: string | number) {
    this.key = key;
  }

  // Main render method - override in subclass
  // Use hooks here (useState, useEffect, etc.)
  // Use useEffect(() => { /* mount */ return () => { /* unmount */ } }, []) for lifecycle
  render(_context: BuildContext): Child {
    return null;
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
