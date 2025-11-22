import {
  Component,
  Element,
  BuildContext,
  HTMLComponent,
  setActiveElement,
} from "../shared/framework.ts";

export class DOMBuildContext extends BuildContext {
  private _inherited: Map<any, any> = new Map();

  get<T>(type: any): T | undefined {
    return this._inherited.get(type);
  }

  get isHydrated(): boolean {
    return true;
  }
}

export class DOMElement extends Element {
  nativeNode: HTMLElement | Text | null = null;
  container: HTMLElement | null = null;
  hooks: any[] = [];

  constructor(component: Component) {
    super(component);
    this.context = new DOMBuildContext();
  }

  mount(
    parentNativeNode: HTMLElement,
    insertBeforeNode: Node | null = null
  ): void {
    this.container = parentNativeNode;
    if (this.component instanceof HTMLComponent) {
      this.nativeNode = document.createElement(this.component.tag);
      this.updateNativeProps(this.component.props);
      if (insertBeforeNode) {
        parentNativeNode.insertBefore(this.nativeNode, insertBeforeNode);
      } else {
        parentNativeNode.appendChild(this.nativeNode);
      }
    } else if (
      typeof this.component === "string" ||
      typeof this.component === "number"
    ) {
      this.nativeNode = document.createTextNode(String(this.component));
      if (insertBeforeNode) {
        parentNativeNode.insertBefore(this.nativeNode, insertBeforeNode);
      } else {
        parentNativeNode.appendChild(this.nativeNode);
      }
      return; // Text nodes don't have children/render
    }

    this.component.onInit(this.context);
    this.performRebuild();
  }

  updateNativeProps(props: Record<string, any>) {
    if (!this.nativeNode || !(this.nativeNode instanceof HTMLElement)) return;

    for (const [key, value] of Object.entries(props)) {
      if (key.startsWith("on") && typeof value === "function") {
        const eventName = key.substring(2).toLowerCase();
        this.nativeNode.addEventListener(eventName, value);
      } else if (key === "style" && typeof value === "object") {
        Object.assign(this.nativeNode.style, value);
      } else if (key === "className") {
        this.nativeNode.className = value;
      } else {
        this.nativeNode.setAttribute(key, String(value));
      }
    }
  }

  performRebuild(): void {
    setActiveElement(this);
    const childOrChildren = this.component.render(this.context);
    setActiveElement(null);

    // Run effects
    this.runEffects();

    const newChildren = Array.isArray(childOrChildren)
      ? childOrChildren
      : [childOrChildren];
    const flattened = newChildren
      .flat()
      .filter((c) => c !== null && c !== undefined);

    this.reconcileChildren(flattened);
  }

  get childContainer(): HTMLElement | null {
    if (this.component instanceof HTMLComponent) {
      return this.nativeNode as HTMLElement;
    }
    return this.container;
  }

  reconcileChildren(newComponents: any[]) {
    const container = this.childContainer;
    if (!container) return;

    const oldChildren = this.children as DOMElement[];
    const newChildren: DOMElement[] = [];

    let oldIndex = 0;
    let newIndex = 0;

    while (newIndex < newComponents.length || oldIndex < oldChildren.length) {
      const newComp = newComponents[newIndex];
      const oldEl = oldChildren[oldIndex];

      if (newComp && oldEl) {
        if (this.canUpdate(oldEl, newComp)) {
          oldEl.update(newComp);
          newChildren.push(oldEl);
        } else {
          oldEl.unmount();
          const newEl = createElement(newComp);
          if (newEl) {
            // Find next node to insert before
            const nextNode = this.findNextNode(oldChildren, oldIndex + 1);
            newEl.mount(container, nextNode);
            newChildren.push(newEl);
          }
        }
        oldIndex++;
        newIndex++;
      } else if (newComp && !oldEl) {
        const newEl = createElement(newComp);
        if (newEl) {
          newEl.mount(container);
          newChildren.push(newEl);
        }
        newIndex++;
      } else if (!newComp && oldEl) {
        oldEl.unmount();
        oldIndex++;
      }
    }

    this.children = newChildren;
  }

  canUpdate(oldEl: DOMElement, newComp: any): boolean {
    if (
      oldEl.component instanceof HTMLComponent &&
      newComp instanceof HTMLComponent
    ) {
      return (
        oldEl.component.tag === newComp.tag &&
        oldEl.component.key === newComp.key
      );
    }
    if (typeof oldEl.component === typeof newComp) {
      if (typeof newComp === "object" && newComp !== null) {
        return (
          oldEl.component.constructor === newComp.constructor &&
          oldEl.component.key === newComp.key
        );
      }
      return true; // Primitives
    }
    return false;
  }

  findNextNode(children: DOMElement[], startIndex: number): Node | null {
    for (let i = startIndex; i < children.length; i++) {
      const child = children[i];
      if (!child) continue;
      const node = child.findFirstNode();
      if (node) return node;
    }
    return null;
  }

  findFirstNode(): Node | null {
    if (this.nativeNode) return this.nativeNode;
    for (const child of this.children as DOMElement[]) {
      if (!child) continue;
      const node = child.findFirstNode();
      if (node) return node;
    }
    return null;
  }

  runEffects() {
    this.hooks.forEach((hook) => {
      if (hook.pending) {
        if (hook.cleanup) hook.cleanup();
        const cleanup = hook.effect();
        hook.cleanup = typeof cleanup === "function" ? cleanup : undefined;
        hook.pending = false;
      }
    });
  }

  markNeedsBuild(): void {
    if (!this.dirty) {
      this.dirty = true;
      // Schedule update (microtask)
      queueMicrotask(() => {
        if (this.dirty) {
          this.dirty = false;
          this.performRebuild();
        }
      });
    }
  }

  update(newComponent: Component): void {
    const oldComponent = this.component;
    this.component = newComponent;
    this.component.onComponentUpdate(oldComponent);
    this.component.onDepsUpdate(this.context);
    this.performRebuild();
  }

  unmount(): void {
    this.component.onDispose(this.context);
    this.hooks.forEach((h) => h.cleanup && h.cleanup());
    this.children.forEach((c) => c.unmount());
    if (this.nativeNode && this.nativeNode.parentNode) {
      this.nativeNode.parentNode.removeChild(this.nativeNode);
    }
  }
}

export function createElement(
  component: Component | string | number
): DOMElement {
  if (component instanceof Component) {
    return new DOMElement(component);
  } else {
    // Wrap text in a component or handle directly in Element
    // For simplicity, let's make a TextComponent wrapper or handle in DOMElement
    // DOMElement handles string/number in mount
    return new DOMElement(component as any);
  }
}

export function render(component: Component, container: HTMLElement) {
  const rootElement = createElement(component);
  rootElement.mount(container);
  return rootElement;
}
