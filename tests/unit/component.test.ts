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
  describe("Component Keys", () => {
    test("should accept key in constructor", () => {
      class TestComponent extends Component {
        override render(_context: BuildContext) {
          return "test";
        }
      }

      const component = new TestComponent("unique-key");
      expect(component.key).toBe("unique-key");
    });

    test("should accept numeric key", () => {
      class TestComponent extends Component {
        override render(_context: BuildContext) {
          return "test";
        }
      }

      const component = new TestComponent(123);
      expect(component.key).toBe(123);
    });

    test("should have undefined key by default", () => {
      class TestComponent extends Component {
        override render(_context: BuildContext) {
          return "test";
        }
      }

      const component = new TestComponent();
      expect(component.key).toBeUndefined();
    });

    test("should support string keys with special characters", () => {
      class TestComponent extends Component {
        override render(_context: BuildContext) {
          return "test";
        }
      }

      const component = new TestComponent("key-with-@#$%");
      expect(component.key).toBe("key-with-@#$%");
    });
  });

  describe("Component Render", () => {
    test("should render string children", () => {
      class TestComponent extends Component {
        override render(_context: BuildContext) {
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
        override render(_context: BuildContext) {
          return 42;
        }
      }

      const component = new TestComponent();
      const context = new MockBuildContext();
      const result = component.render(context);

      expect(result).toBe(42);
    });

    test("should render zero correctly", () => {
      class TestComponent extends Component {
        override render(_context: BuildContext) {
          return 0;
        }
      }

      const component = new TestComponent();
      const context = new MockBuildContext();
      const result = component.render(context);

      expect(result).toBe(0);
    });

    test("should render empty array", () => {
      class TestComponent extends Component {
        override render(_context: BuildContext) {
          return [];
        }
      }

      const component = new TestComponent();
      const context = new MockBuildContext();
      const result = component.render(context);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    test("should render null", () => {
      class TestComponent extends Component {
        override render(_context: BuildContext) {
          return null;
        }
      }

      const component = new TestComponent();
      const context = new MockBuildContext();
      const result = component.render(context);

      expect(result).toBeNull();
    });

    test("should render undefined", () => {
      class TestComponent extends Component {
        override render(_context: BuildContext) {
          return undefined;
        }
      }

      const component = new TestComponent();
      const context = new MockBuildContext();
      const result = component.render(context);

      expect(result).toBeUndefined();
    });

    test("should render nested components", () => {
      class ChildComponent extends Component {
        override render(_context: BuildContext) {
          return "Child";
        }
      }

      class ParentComponent extends Component {
        override render(_context: BuildContext) {
          return new ChildComponent();
        }
      }

      const component = new ParentComponent();
      const context = new MockBuildContext();
      const result = component.render(context);

      expect(result).toBeInstanceOf(ChildComponent);
    });

    test("should render multiple levels of nested components", () => {
      class Level3Component extends Component {
        override render(_context: BuildContext) {
          return "Level 3";
        }
      }

      class Level2Component extends Component {
        override render(_context: BuildContext) {
          return new Level3Component();
        }
      }

      class Level1Component extends Component {
        override render(_context: BuildContext) {
          return new Level2Component();
        }
      }

      const component = new Level1Component();
      const context = new MockBuildContext();
      const result = component.render(context);

      expect(result).toBeInstanceOf(Level2Component);
    });

    test("should support constructor parameters", () => {
      class ParameterizedComponent extends Component {
        message: string;

        constructor(message: string) {
          super();
          this.message = message;
        }

        override render(_context: BuildContext) {
          return this.message;
        }
      }

      const component = new ParameterizedComponent("Hello Param");
      const context = new MockBuildContext();
      const result = component.render(context);

      expect(result).toBe("Hello Param");
    });

    test("should support multiple constructor parameters", () => {
      class MultiParamComponent extends Component {
        title: string;
        count: number;

        constructor(title: string, count: number) {
          super();
          this.title = title;
          this.count = count;
        }

        override render(_context: BuildContext) {
          return `${this.title}: ${this.count}`;
        }
      }

      const component = new MultiParamComponent("Items", 5);
      const context = new MockBuildContext();
      const result = component.render(context);

      expect(result).toBe("Items: 5");
    });

    test("should render component with key and parameters", () => {
      class KeyedComponent extends Component {
        value: string;

        constructor(value: string, key?: string) {
          super(key);
          this.value = value;
        }

        override render(_context: BuildContext) {
          return this.value;
        }
      }

      const component = new KeyedComponent("test-value", "unique-key");
      const context = new MockBuildContext();
      const result = component.render(context);

      expect(result).toBe("test-value");
      expect(component.key).toBe("unique-key");
    });
  });

  describe("Component Context Usage", () => {
    test("should access context services", () => {
      class TestService {
        getValue() {
          return "service-value";
        }
      }

      class ContextAwareComponent extends Component {
        override render(context: BuildContext) {
          const service = context.get<TestService>(TestService);
          return service?.getValue() || "no-service";
        }
      }

      const context = new MockBuildContext();
      const service = new TestService();
      context.set(TestService, service);

      const component = new ContextAwareComponent();
      const result = component.render(context);

      expect(result).toBe("service-value");
    });

    test("should handle missing context services gracefully", () => {
      class TestService {
        getValue() {
          return "service-value";
        }
      }

      class ContextAwareComponent extends Component {
        override render(context: BuildContext) {
          const service = context.get<TestService>(TestService);
          return service ? "has-service" : "no-service";
        }
      }

      const context = new MockBuildContext();
      const component = new ContextAwareComponent();
      const result = component.render(context);

      expect(result).toBe("no-service");
    });

    test("should store and retrieve multiple services", () => {
      class ServiceA {
        name = "A";
      }
      class ServiceB {
        name = "B";
      }

      class MultiServiceComponent extends Component {
        override render(context: BuildContext) {
          const a = context.get<ServiceA>(ServiceA);
          const b = context.get<ServiceB>(ServiceB);
          return `${a?.name}${b?.name}`;
        }
      }

      const context = new MockBuildContext();
      context.set(ServiceA, new ServiceA());
      context.set(ServiceB, new ServiceB());

      const component = new MultiServiceComponent();
      const result = component.render(context);

      expect(result).toBe("AB");
    });
  });

  describe("Static Properties", () => {
    test("should have isServer and isClient as false by default", () => {
      class TestComponent extends Component {
        override render(_context: BuildContext) {
          return "test";
        }
      }

      expect((TestComponent as any).isServer).toBe(false);
      expect((TestComponent as any).isClient).toBe(false);
    });
  });

  describe("Component Edge Cases", () => {
    test("should render component returning another component instance", () => {
      class InnerComponent extends Component {
        override render(_context: BuildContext) {
          return "inner";
        }
      }

      class OuterComponent extends Component {
        override render(_context: BuildContext) {
          return new InnerComponent();
        }
      }

      const component = new OuterComponent();
      const context = new MockBuildContext();
      const result = component.render(context);

      expect(result).toBeInstanceOf(InnerComponent);
    });

    test("should render component with mixed content", () => {
      class MixedComponent extends Component {
        override render(_context: BuildContext) {
          return [
            "text",
            123,
            new HTMLComponent("span", {}, ["nested"]),
            null,
            undefined,
          ];
        }
      }

      const component = new MixedComponent();
      const context = new MockBuildContext();
      const result = component.render(context);

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(5);
    });

    test("should support component inheritance", () => {
      class BaseComponent extends Component {
        baseName = "base";

        override render(_context: BuildContext) {
          return this.baseName;
        }
      }

      class DerivedComponent extends BaseComponent {
        override render(_context: BuildContext) {
          return `${this.baseName}-derived`;
        }
      }

      const component = new DerivedComponent();
      const context = new MockBuildContext();
      const result = component.render(context);

      expect(result).toBe("base-derived");
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

  test("should support deep nesting", () => {
    const level3 = new HTMLComponent("em", {}, ["deep"]);
    const level2 = new HTMLComponent("strong", {}, [level3]);
    const level1 = new HTMLComponent("p", {}, [level2]);

    const result = level1.render(new MockBuildContext());
    expect(result).toContain(level2);
  });

  test("should handle various HTML tags", () => {
    const tags = [
      "div",
      "span",
      "p",
      "h1",
      "ul",
      "li",
      "a",
      "button",
      "input",
      "form",
    ];

    tags.forEach((tag) => {
      const component = new HTMLComponent(tag);
      expect(component.tag).toBe(tag);
    });
  });

  test("should support self-closing tags", () => {
    const component = new HTMLComponent("input", { type: "text" });
    expect(component.tag).toBe("input");
    expect(component.props.type).toBe("text");
  });

  test("should preserve prop values of different types", () => {
    const props = {
      string: "value",
      number: 42,
      array: [1, 2, 3],
      object: { nested: true },
    };

    const component = new HTMLComponent("div", props);
    expect(component.props.string).toBe("value");
    expect(component.props.number).toBe(42);
    expect(component.props.array).toEqual([1, 2, 3]);
    expect(component.props.object).toEqual({ nested: true });
  });

  test("should support event handlers in props", () => {
    const handleClick = () => "clicked";
    const props = { onclick: handleClick };

    const component = new HTMLComponent("button", props);
    expect(component.props.onclick).toBe(handleClick);
    expect(component.props.onclick?.()).toBe("clicked");
  });

  test("should support multiple event handlers", () => {
    const handleClick = () => "click";
    const handleMouseEnter = () => "enter";

    const props = {
      onclick: handleClick,
      onmouseenter: handleMouseEnter,
    };

    const component = new HTMLComponent("div", props);
    expect(component.props.onclick?.()).toBe("click");
    expect(component.props.onmouseenter?.()).toBe("enter");
  });

  test("should handle children with mixed types", () => {
    const children = [
      "text",
      123,
      null,
      undefined,
      new HTMLComponent("span", {}, ["nested"]),
    ];

    const component = new HTMLComponent("div", {}, children);
    expect(component.children).toEqual(children);
  });

  test("should support HTML5 data attributes", () => {
    const props = {
      "data-id": "123",
      "data-name": "test",
      "aria-label": "button",
    };

    const component = new HTMLComponent("div", props);
    expect(component.props["data-id"]).toBe("123");
    expect(component.props["data-name"]).toBe("test");
    expect(component.props["aria-label"]).toBe("button");
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

  test("should support storing multiple different types", () => {
    const context = new MockBuildContext();

    class Service1 {
      id = 1;
    }
    class Service2 {
      id = 2;
    }

    const s1 = new Service1();
    const s2 = new Service2();

    context.set(Service1, s1);
    context.set(Service2, s2);

    expect(context.get<Service1>(Service1)?.id).toBe(1);
    expect(context.get<Service2>(Service2)?.id).toBe(2);
  });

  test("should support overwriting values", () => {
    const context = new MockBuildContext();
    class MyService {
      value: string;
      constructor(value: string) {
        this.value = value;
      }
    }

    const service1 = new MyService("first");
    const service2 = new MyService("second");

    context.set(MyService, service1);
    expect(context.get<MyService>(MyService)?.value).toBe("first");

    context.set(MyService, service2);
    expect(context.get<MyService>(MyService)?.value).toBe("second");
  });
});
