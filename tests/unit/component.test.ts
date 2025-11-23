import { describe, test, expect } from "bun:test";
import {
  Component,
  BuildContext,
  HTMLComponent,
} from "../../src/shared/framework.ts";

// Mock BuildContext for testing
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

describe("Component", () => {
  describe("Lifecycle Methods", () => {
    test("should call onMount when component is mounted", () => {
      let mountCalled = false;
      class TestComponent extends Component {
        override onMount(_context: BuildContext): void {
          mountCalled = true;
        }
        render(_context: BuildContext) {
          return "test";
        }
      }

      const component = new TestComponent();
      const context = new MockBuildContext();
      component.onMount(context);

      expect(mountCalled).toBe(true);
    });

    test("should call onUnmount when component is unmounted", () => {
      let unmountCalled = false;
      class TestComponent extends Component {
        override onUnmount(_context: BuildContext): void {
          unmountCalled = true;
        }
        render(_context: BuildContext) {
          return "test";
        }
      }

      const component = new TestComponent();
      const context = new MockBuildContext();
      component.onUnmount(context);

      expect(unmountCalled).toBe(true);
    });
  });

  describe("Component Keys", () => {
    test("should accept key in constructor", () => {
      class TestComponent extends Component {
        render(_context: BuildContext) {
          return "test";
        }
      }

      const component = new TestComponent("unique-key");
      expect(component.key).toBe("unique-key");
    });

    test("should accept numeric key", () => {
      class TestComponent extends Component {
        render(_context: BuildContext) {
          return "test";
        }
      }

      const component = new TestComponent(123);
      expect(component.key).toBe(123);
    });

    test("should have undefined key by default", () => {
      class TestComponent extends Component {
        render(_context: BuildContext) {
          return "test";
        }
      }

      const component = new TestComponent();
      expect(component.key).toBeUndefined();
    });
  });

  describe("Component Render", () => {
    test("should render string children", () => {
      class TestComponent extends Component {
        render(_context: BuildContext) {
          return "Hello World";
        }
      }

      const component = new TestComponent();
      const context = new MockBuildContext();
      const result = component.render(context);

      expect(result).toBe("Hello World");
    });

    test("should render number children", () => {
      class TestComponent extends Component {
        render(_context: BuildContext) {
          return 42;
        }
      }

      const component = new TestComponent();
      const context = new MockBuildContext();
      const result = component.render(context);

      expect(result).toBe(42);
    });

    test("should render array of children", () => {
      class TestComponent extends Component {
        render(_context: BuildContext) {
          return ["Hello", " ", "World"];
        }
      }

      const component = new TestComponent();
      const context = new MockBuildContext();
      const result = component.render(context);

      expect(Array.isArray(result)).toBe(true);
      expect(result).toEqual(["Hello", " ", "World"]);
    });

    test("should render null", () => {
      class TestComponent extends Component {
        render(_context: BuildContext) {
          return null;
        }
      }

      const component = new TestComponent();
      const context = new MockBuildContext();
      const result = component.render(context);

      expect(result).toBeNull();
    });

    test("should render nested components", () => {
      class ChildComponent extends Component {
        render(_context: BuildContext) {
          return "Child";
        }
      }

      class ParentComponent extends Component {
        render(_context: BuildContext) {
          return new ChildComponent();
        }
      }

      const component = new ParentComponent();
      const context = new MockBuildContext();
      const result = component.render(context);

      expect(result).toBeInstanceOf(ChildComponent);
    });
  });

  describe("Static Properties", () => {
    test("should have isServer and isClient as false by default", () => {
      class TestComponent extends Component {
        render(_context: BuildContext) {
          return "test";
        }
      }

      expect((TestComponent as any).isServer).toBe(false);
      expect((TestComponent as any).isClient).toBe(false);
    });
  });
});

describe("HTMLComponent", () => {
  test("should create HTML component with tag", () => {
    const component = new HTMLComponent("div");
    expect(component.tag).toBe("div");
  });

  test("should create HTML component with props", () => {
    const props = { id: "test", className: "container" };
    const component = new HTMLComponent("div", props);
    expect(component.props).toEqual(props);
  });

  test("should create HTML component with children", () => {
    const children = ["Hello", " ", "World"];
    const component = new HTMLComponent("div", {}, children);
    expect(component.children).toEqual(children);
  });

  test("should render children", () => {
    const children = ["Hello", " ", "World"];
    const component = new HTMLComponent("div", {}, children);
    const context = new MockBuildContext();
    const result = component.render(context);

    expect(result).toEqual(children);
  });

  test("should extract key from props", () => {
    const component = new HTMLComponent("div", { key: "my-key" });
    expect(component.key).toBe("my-key");
  });

  test("should handle empty props and children", () => {
    const component = new HTMLComponent("span");
    expect(component.props).toEqual({});
    expect(component.children).toEqual([]);
  });

  test("should support nested HTMLComponents", () => {
    const child = new HTMLComponent("span", {}, ["inner"]);
    const parent = new HTMLComponent("div", {}, [child]);

    expect(parent.children.length).toBe(1);
    expect(parent.children[0]).toBe(child);
  });
});

describe("BuildContext", () => {
  test("should store and retrieve typed values", () => {
    const context = new MockBuildContext();
    class MyService {
      name = "test";
    }

    const service = new MyService();
    context.set(MyService, service);

    const retrieved = context.get<MyService>(MyService);
    expect(retrieved).toBe(service);
    expect(retrieved?.name).toBe("test");
  });

  test("should return undefined for missing values", () => {
    const context = new MockBuildContext();
    class MyService {}

    const retrieved = context.get<MyService>(MyService);
    expect(retrieved).toBeUndefined();
  });

  test("should report isHydrated correctly", () => {
    const context = new MockBuildContext();
    expect(context.isHydrated).toBe(false);
  });
});
