import { describe, test, expect } from "bun:test";
import { renderToString, SSRElement } from "../../src/server/ssr.ts";
import {
  Component,
  BuildContext,
  HTMLComponent,
  useState,
  useWatch,
} from "../../src/shared/framework.ts";

describe("Server-Side Rendering", () => {
  describe("SSR Basic Rendering", () => {
    test("should render simple text", () => {
      const result = renderToString("Hello World" as any);
      expect(result).toBe("Hello World");
    });

    test("should render number as text", () => {
      const result = renderToString(123 as any);
      expect(result).toBe("123");
    });

    test("should render HTMLComponent with tag", () => {
      const component = new HTMLComponent("div", {}, ["content"]);
      const result = renderToString(component);
      expect(result).toBe("<div>content</div>");
    });

    test("should render HTMLComponent with props", () => {
      const component = new HTMLComponent("div", {
        id: "test",
        className: "container",
      });
      const result = renderToString(component);
      expect(result).toContain('id="test"');
      expect(result).toContain('class="container"');
    });

    test("should skip event handlers in SSR", () => {
      const component = new HTMLComponent("button", {
        onClick: () => console.log("clicked"),
      });
      const result = renderToString(component);
      expect(result).not.toContain("onClick");
      expect(result).not.toContain("onclick");
    });

    test("should skip children prop", () => {
      const component = new HTMLComponent("div", {
        children: "should be ignored",
      });
      const result = renderToString(component);
      expect(result).toBe("<div></div>");
    });
  });

  describe("SSR Style Rendering", () => {
    test("should convert style object to CSS string", () => {
      const component = new HTMLComponent("div", {
        style: { color: "red", fontSize: "16px" },
      });
      const result = renderToString(component);
      expect(result).toContain("style=");
      expect(result).toContain("color");
      expect(result).toContain("font-size"); // camelCase converted to kebab-case
    });

    test("should handle empty style object", () => {
      const component = new HTMLComponent("div", { style: {} });
      const result = renderToString(component);
      expect(result).toBe("<div></div>");
    });

    test("should handle null style", () => {
      const component = new HTMLComponent("div", { style: null });
      const result = renderToString(component);
      expect(result).toBe("<div></div>");
    });

    test("should handle complex style properties", () => {
      const component = new HTMLComponent("div", {
        style: {
          backgroundColor: "blue",
          marginTop: "10px",
          padding: "5px 10px",
        },
      });
      const result = renderToString(component);
      expect(result).toContain("style=");
      expect(result).toContain("background-color");
      expect(result).toContain("margin-top");
      expect(result).toContain("padding");
    });
  });

  describe("SSR Component Rendering", () => {
    test("should render custom component", () => {
      class TestComponent extends Component {
        override render(_context: BuildContext) {
          return new HTMLComponent("p", {}, ["Hello"]);
        }
      }

      const result = renderToString(new TestComponent());
      expect(result).toBe("<p>Hello</p>");
    });

    test("should NOT run useWatch during SSR", () => {
      let effectCalled = false;

      class TestComponent extends Component {
        override render(_context: BuildContext) {
          useWatch(() => {
            effectCalled = true;
          }, []);
          return "test";
        }
      }

      renderToString(new TestComponent());
      // Effects should NOT run during SSR (they're client-side only)
      expect(effectCalled).toBe(false);
    });

    test("should render nested components", () => {
      class ChildComponent extends Component {
        override render(_context: BuildContext) {
          return new HTMLComponent("span", {}, ["child"]);
        }
      }

      class ParentComponent extends Component {
        override render(_context: BuildContext) {
          return new HTMLComponent("div", {}, [new ChildComponent()]);
        }
      }

      const result = renderToString(new ParentComponent());
      expect(result).toBe("<div><span>child</span></div>");
    });

    test("should render array of children", () => {
      class TestComponent extends Component {
        override render(_context: BuildContext) {
          return [
            new HTMLComponent("h1", {}, ["Title"]),
            new HTMLComponent("p", {}, ["Content"]),
          ];
        }
      }

      const result = renderToString(new TestComponent());
      expect(result).toBe("<h1>Title</h1><p>Content</p>");
    });

    test("should filter out null and undefined children", () => {
      class TestComponent extends Component {
        override render(_context: BuildContext) {
          return ["A", null, "B", undefined, "C"];
        }
      }

      const result = renderToString(new TestComponent());
      expect(result).toBe("ABC");
    });

    test("should flatten nested arrays", () => {
      class TestComponent extends Component {
        override render(_context: BuildContext) {
          return [
            ["A", "B"],
            ["C", "D"],
          ];
        }
      }

      const result = renderToString(new TestComponent());
      expect(result).toBe("ABCD");
    });
  });

  describe("SSR with Hooks", () => {
    test("should work with useState during SSR", () => {
      class CounterComponent extends Component {
        override render(_context: BuildContext) {
          const [count] = useState(0);
          return new HTMLComponent("div", {}, [`Count: ${count}`]);
        }
      }

      const result = renderToString(new CounterComponent());
      expect(result).toBe("<div>Count: 0</div>");
    });

    test("should maintain hook state within render", () => {
      class MultiStateComponent extends Component {
        override render(_context: BuildContext) {
          const [name] = useState("John");
          const [age] = useState(30);
          return new HTMLComponent("div", {}, [`${name} is ${age}`]);
        }
      }

      const result = renderToString(new MultiStateComponent());
      expect(result).toBe("<div>John is 30</div>");
    });
  });

  describe("SSR BuildContext", () => {
    test("should have isHydrated as false", () => {
      let hydrated: boolean | undefined;

      class TestComponent extends Component {
        override render(context: BuildContext) {
          hydrated = context.isHydrated;
          return "test";
        }
      }

      renderToString(new TestComponent());
      expect(hydrated).toBe(false);
    });

    test("should return undefined for context.get()", () => {
      let retrievedValue: any;

      class TestComponent extends Component {
        override render(context: BuildContext) {
          retrievedValue = context.get("something");
          return "test";
        }
      }

      renderToString(new TestComponent());
      expect(retrievedValue).toBeUndefined();
    });
  });

  describe("SSR Complex Scenarios", () => {
    test("should render complete HTML structure", () => {
      class AppComponent extends Component {
        override render(_context: BuildContext) {
          return new HTMLComponent("html", {}, [
            new HTMLComponent("head", {}, [
              new HTMLComponent("title", {}, ["My App"]),
            ]),
            new HTMLComponent("body", {}, [
              new HTMLComponent("div", { id: "root" }, [
                new HTMLComponent("h1", {}, ["Welcome"]),
                new HTMLComponent("p", {}, ["This is a test"]),
              ]),
            ]),
          ]);
        }
      }

      const result = renderToString(new AppComponent());
      expect(result).toContain("<html>");
      expect(result).toContain("<head>");
      expect(result).toContain("<title>My App</title>");
      expect(result).toContain('<div id="root">');
      expect(result).toContain("<h1>Welcome</h1>");
      expect(result).toContain("<p>This is a test</p>");
    });

    test("should handle mixed content types", () => {
      class MixedComponent extends Component {
        override render(_context: BuildContext) {
          return new HTMLComponent("div", {}, [
            "Text ",
            123,
            " ",
            new HTMLComponent("span", {}, ["nested"]),
          ]);
        }
      }

      const result = renderToString(new MixedComponent());
      expect(result).toBe("<div>Text 123 <span>nested</span></div>");
    });

    test("should render list of items", () => {
      class ListComponent extends Component {
        override render(_context: BuildContext) {
          const items = ["Apple", "Banana", "Cherry"];
          return new HTMLComponent(
            "ul",
            {},
            items.map((item) => new HTMLComponent("li", {}, [item]))
          );
        }
      }

      const result = renderToString(new ListComponent());
      expect(result).toBe(
        "<ul><li>Apple</li><li>Banana</li><li>Cherry</li></ul>"
      );
    });
  });

  describe("SSRElement", () => {
    test("should create SSRElement", () => {
      class TestComponent extends Component {
        override render(_context: BuildContext) {
          return "test";
        }
      }

      const element = new SSRElement(new TestComponent());
      expect(element).toBeInstanceOf(SSRElement);
    });

    test("should have hooks array", () => {
      class TestComponent extends Component {
        override render(_context: BuildContext) {
          return "test";
        }
      }

      const element = new SSRElement(new TestComponent());
      expect(Array.isArray(element.hooks)).toBe(true);
    });

    test("mount should be no-op", () => {
      class TestComponent extends Component {
        override render(_context: BuildContext) {
          return "test";
        }
      }

      const element = new SSRElement(new TestComponent());
      expect(() => element.mount(null)).not.toThrow();
    });

    test("update should be no-op", () => {
      class TestComponent extends Component {
        override render(_context: BuildContext) {
          return "test";
        }
      }

      const element = new SSRElement(new TestComponent());
      expect(() => element.update(new TestComponent())).not.toThrow();
    });

    test("unmount should be no-op", () => {
      class TestComponent extends Component {
        override render(_context: BuildContext) {
          return "test";
        }
      }

      const element = new SSRElement(new TestComponent());
      expect(() => element.unmount()).not.toThrow();
    });

    test("markNeedsBuild should be no-op", () => {
      class TestComponent extends Component {
        override render(_context: BuildContext) {
          return "test";
        }
      }

      const element = new SSRElement(new TestComponent());
      expect(() => element.markNeedsBuild()).not.toThrow();
    });

    test("performRebuild should be no-op", () => {
      class TestComponent extends Component {
        override render(_context: BuildContext) {
          return "test";
        }
      }

      const element = new SSRElement(new TestComponent());
      expect(() => element.performRebuild()).not.toThrow();
    });
  });
});
