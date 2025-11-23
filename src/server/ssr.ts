import {
  Component,
  Element,
  BuildContext,
  HTMLComponent,
  setActiveElement,
} from "@/shared/framework.ts";
import styleObjectToCssString from "style-object-to-css-string";

export class SSRBuildContext extends BuildContext {
  get<T>(_type: any): T | undefined {
    return undefined;
  }
  get isHydrated(): boolean {
    return false;
  }
}

export class SSRElement extends Element {
  hooks: any[] = [];

  constructor(component: Component) {
    super(component);
    this.context = new SSRBuildContext();
  }

  mount(_parent: any): void {
    // No-op for SSR mount
  }

  update(_newComponent: Component): void {
    // No-op for SSR update
  }

  unmount(): void {
    // No-op
  }

  markNeedsBuild(): void {
    // No-op
  }

  performRebuild(): void {
    // No-op
  }

  override toString(): string {
    setActiveElement(this);

    if (
      typeof this.component === "string" ||
      typeof this.component === "number"
    ) {
      setActiveElement(null);
      return String(this.component);
    }

    if (this.component instanceof Component) {
      this.component._triggerMount(this.context);
    }
    const childOrChildren = this.component.render(this.context);
    setActiveElement(null);

    const children = Array.isArray(childOrChildren)
      ? childOrChildren
      : [childOrChildren];
    const renderedChildren = children
      .flat()
      .filter((c) => c !== null && c !== undefined)
      .map((c) => {
        const el = new SSRElement(c as Component);
        return el.toString();
      })
      .join("");

    if (this.component instanceof HTMLComponent) {
      const { tag, props } = this.component;
      const attrs = Object.entries(props)
        .map(([k, v]) => {
          if (k === "className") return `class="${v}"`;
          if (k.startsWith("on")) return ""; // Skip events
          if (k === "children") return "";
          if (k === "style") {
            if (typeof v === "object" && v !== null) {
              // Use library to safely convert style object to CSS string
              const cssString = styleObjectToCssString(v);
              return cssString ? `style="${cssString}"` : "";
            }
            return ""; // Skip null, undefined, or non-object styles
          }
          return `${k}="${v}"`;
        })
        .filter(Boolean)
        .join(" ");

      return `<${tag}${attrs ? " " + attrs : ""}>${renderedChildren}</${tag}>`;
    }

    return renderedChildren;
  }
}

export function renderToString(component: Component): string {
  const root = new SSRElement(component);
  return root.toString();
}
