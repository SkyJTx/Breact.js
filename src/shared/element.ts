import { Component } from "./component";
import { BuildContext } from "./context";

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
