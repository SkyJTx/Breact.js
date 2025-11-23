import { describe, test, expect } from "bun:test";
import {
  Component,
  BuildContext,
  Element,
} from "../../src/shared/framework.ts";

// Mock implementations
class MockBuildContext extends BuildContext {
  private data = new Map<any, any>();

  get<T>(type: any): T | undefined {
    return this.data.get(type);
  }

  set(type: any, value: any) {
    this.data.set(type, value);
  }

  get isHydrated(): boolean {
    return false;
  }
}

class MockElement extends Element {
  mountCalled = false;
  updateCalled = false;
  unmountCalled = false;
  markBuildCalled = false;
  rebuildCalled = false;

  mount(_parent: any): void {
    this.mountCalled = true;
  }

  update(_newComponent: Component): void {
    this.updateCalled = true;
  }

  unmount(): void {
    this.unmountCalled = true;
  }

  markNeedsBuild(): void {
    this.markBuildCalled = true;
  }

  performRebuild(): void {
    this.rebuildCalled = true;
  }
}

describe("Element", () => {
  describe("Element Creation", () => {
    test("should create element with component", () => {
      class TestComponent extends Component {
        render(_context: BuildContext) {
          return "test";
        }
      }

      const component = new TestComponent();
      const element = new MockElement(component);

      expect(element.component).toBe(component);
    });

    test("should initialize with empty children array", () => {
      class TestComponent extends Component {
        render(_context: BuildContext) {
          return "test";
        }
      }

      const component = new TestComponent();
      const element = new MockElement(component);

      expect(element.children).toEqual([]);
      expect(element.children.length).toBe(0);
    });

    test("should initialize as dirty", () => {
      class TestComponent extends Component {
        render(_context: BuildContext) {
          return "test";
        }
      }

      const component = new TestComponent();
      const element = new MockElement(component);

      expect(element.dirty).toBe(true);
    });

    test("should not have parent initially", () => {
      class TestComponent extends Component {
        render(_context: BuildContext) {
          return "test";
        }
      }

      const component = new TestComponent();
      const element = new MockElement(component);

      expect(element.parent).toBeUndefined();
    });
  });

  describe("Element Hierarchy", () => {
    test("should set parent reference", () => {
      class TestComponent extends Component {
        render(_context: BuildContext) {
          return "test";
        }
      }

      const parent = new MockElement(new TestComponent());
      const child = new MockElement(new TestComponent());

      child.parent = parent;

      expect(child.parent).toBe(parent);
    });

    test("should manage children array", () => {
      class TestComponent extends Component {
        render(_context: BuildContext) {
          return "test";
        }
      }

      const parent = new MockElement(new TestComponent());
      const child1 = new MockElement(new TestComponent());
      const child2 = new MockElement(new TestComponent());

      parent.children.push(child1, child2);

      expect(parent.children.length).toBe(2);
      expect(parent.children[0]).toBe(child1);
      expect(parent.children[1]).toBe(child2);
    });

    test("should support nested hierarchy", () => {
      class TestComponent extends Component {
        render(_context: BuildContext) {
          return "test";
        }
      }

      const root = new MockElement(new TestComponent());
      const level1 = new MockElement(new TestComponent());
      const level2 = new MockElement(new TestComponent());

      root.children.push(level1);
      level1.parent = root;
      level1.children.push(level2);
      level2.parent = level1;

      expect(root.children[0]).toBe(level1);
      expect(level1.parent).toBe(root);
      expect(level1.children[0]).toBe(level2);
      expect(level2.parent).toBe(level1);
    });
  });

  describe("Element Lifecycle", () => {
    test("should call mount", () => {
      class TestComponent extends Component {
        render(_context: BuildContext) {
          return "test";
        }
      }

      const element = new MockElement(new TestComponent());
      element.mount(null);

      expect(element.mountCalled).toBe(true);
    });

    test("should call update", () => {
      class TestComponent extends Component {
        render(_context: BuildContext) {
          return "test";
        }
      }

      const element = new MockElement(new TestComponent());
      const newComponent = new TestComponent();
      element.update(newComponent);

      expect(element.updateCalled).toBe(true);
    });

    test("should call unmount", () => {
      class TestComponent extends Component {
        render(_context: BuildContext) {
          return "test";
        }
      }

      const element = new MockElement(new TestComponent());
      element.unmount();

      expect(element.unmountCalled).toBe(true);
    });

    test("should call markNeedsBuild", () => {
      class TestComponent extends Component {
        render(_context: BuildContext) {
          return "test";
        }
      }

      const element = new MockElement(new TestComponent());
      element.markNeedsBuild();

      expect(element.markBuildCalled).toBe(true);
    });

    test("should call performRebuild", () => {
      class TestComponent extends Component {
        render(_context: BuildContext) {
          return "test";
        }
      }

      const element = new MockElement(new TestComponent());
      element.performRebuild();

      expect(element.rebuildCalled).toBe(true);
    });
  });

  describe("Element Context", () => {
    test("should have context reference", () => {
      class TestComponent extends Component {
        render(_context: BuildContext) {
          return "test";
        }
      }

      const element = new MockElement(new TestComponent());
      const context = new MockBuildContext();
      element.context = context;

      expect(element.context).toBe(context);
    });

    test("should access context properties", () => {
      class TestComponent extends Component {
        render(_context: BuildContext) {
          return "test";
        }
      }

      const element = new MockElement(new TestComponent());
      const context = new MockBuildContext();
      element.context = context;

      expect(element.context.isHydrated).toBe(false);
    });

    test("should use context to get services", () => {
      class TestComponent extends Component {
        render(_context: BuildContext) {
          return "test";
        }
      }

      class MyService {
        value = 42;
      }

      const element = new MockElement(new TestComponent());
      const context = new MockBuildContext();
      const service = new MyService();
      context.set(MyService, service);
      element.context = context;

      const retrieved = element.context.get<MyService>(MyService);
      expect(retrieved).toBe(service);
      expect(retrieved?.value).toBe(42);
    });
  });

  describe("Element State", () => {
    test("should track dirty state", () => {
      class TestComponent extends Component {
        render(_context: BuildContext) {
          return "test";
        }
      }

      const element = new MockElement(new TestComponent());

      expect(element.dirty).toBe(true);

      element.dirty = false;
      expect(element.dirty).toBe(false);

      element.dirty = true;
      expect(element.dirty).toBe(true);
    });

    test("should maintain component reference", () => {
      class TestComponent extends Component {
        value: number;
        constructor(value: number) {
          super();
          this.value = value;
        }
        render(_context: BuildContext) {
          return String(this.value);
        }
      }

      const component1 = new TestComponent(1);
      const component2 = new TestComponent(2);
      const element = new MockElement(component1);

      expect(element.component).toBe(component1);
      expect((element.component as TestComponent).value).toBe(1);

      element.component = component2;

      expect(element.component).toBe(component2);
      expect((element.component as TestComponent).value).toBe(2);
    });
  });

  describe("Abstract Element Methods", () => {
    test("should require mount implementation", () => {
      // This is verified by TypeScript, but we test the abstract nature
      class IncompleteElement extends Element {
        // All abstract methods must be implemented
        mount(_parent: any): void {}
        update(_newComponent: Component): void {}
        unmount(): void {}
        markNeedsBuild(): void {}
        performRebuild(): void {}
      }

      // TypeScript enforces implementation
      expect(() => {
        new IncompleteElement(
          new (class extends Component {
            render() {
              return "test";
            }
          })()
        );
      }).not.toThrow();
    });

    test("should allow custom element implementations", () => {
      class CustomElement extends Element {
        customProperty = "custom";

        mount(_parent: any): void {
          this.customProperty = "mounted";
        }

        update(_newComponent: Component): void {
          this.customProperty = "updated";
        }

        unmount(): void {
          this.customProperty = "unmounted";
        }

        markNeedsBuild(): void {
          this.dirty = true;
        }

        performRebuild(): void {
          this.dirty = false;
        }
      }

      class TestComponent extends Component {
        render(_context: BuildContext) {
          return "test";
        }
      }

      const element = new CustomElement(new TestComponent());

      expect(element.customProperty).toBe("custom");

      element.mount(null);
      expect(element.customProperty).toBe("mounted");

      element.update(new TestComponent());
      expect(element.customProperty).toBe("updated");

      element.unmount();
      expect(element.customProperty).toBe("unmounted");
    });
  });

  describe("Element Component Relationship", () => {
    test("should maintain bidirectional relationship via parent", () => {
      class TestComponent extends Component {
        render(_context: BuildContext) {
          return "test";
        }
      }

      const parentComponent = new TestComponent();
      const childComponent = new TestComponent();

      const parent = new MockElement(parentComponent);
      const child = new MockElement(childComponent);

      child.parent = parent;
      parent.children.push(child);

      expect(child.parent).toBe(parent);
      expect(parent.children).toContain(child);
      expect(child.parent.component).toBe(parentComponent);
    });

    test("should allow element tree traversal", () => {
      class TestComponent extends Component {
        name: string;
        constructor(name: string) {
          super();
          this.name = name;
        }
        render(_context: BuildContext) {
          return this.name;
        }
      }

      const root = new MockElement(new TestComponent("root"));
      const child1 = new MockElement(new TestComponent("child1"));
      const child2 = new MockElement(new TestComponent("child2"));
      const grandchild = new MockElement(new TestComponent("grandchild"));

      root.children = [child1, child2];
      child1.parent = root;
      child2.parent = root;
      child1.children = [grandchild];
      grandchild.parent = child1;

      // Traverse down
      expect(root.children.length).toBe(2);
      expect((root.children[0]!.component as TestComponent).name).toBe(
        "child1"
      );
      expect((root.children[1]!.component as TestComponent).name).toBe(
        "child2"
      );
      expect(
        (root.children[0]!.children[0]!.component as TestComponent).name
      ).toBe("grandchild");

      // Traverse up
      expect((grandchild.parent!.component as TestComponent).name).toBe(
        "child1"
      );
      expect((grandchild.parent!.parent!.component as TestComponent).name).toBe(
        "root"
      );
    });
  });
});
