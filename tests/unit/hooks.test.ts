import { describe, test, expect, beforeEach } from "bun:test";
import {
  Component,
  BuildContext,
  Element,
  useState,
  useEffect,
  setActiveElement,
  getActiveElement,
  getHookState,
  getHookIndex,
} from "../../src/shared/framework.ts";

// Mock classes
class MockBuildContext extends BuildContext {
  get<T>(_type: any): T | undefined {
    return undefined;
  }
  get isHydrated(): boolean {
    return false;
  }
}

class MockElement extends Element {
  hooks: any[] = [];

  mount(_parent: any): void {}
  update(_newComponent: Component): void {}
  unmount(): void {}
  markNeedsBuild(): void {}
  performRebuild(): void {}
}

describe("Hooks System", () => {
  beforeEach(() => {
    // Reset active element before each test
    setActiveElement(null);
  });

  describe("Hook Context Management", () => {
    test("should throw error when hook called outside render", () => {
      expect(() => {
        useState(0);
      }).toThrow("Hook called outside of render()");
    });

    test("should allow hooks when active element is set", () => {
      const mockComponent = new (class extends Component {
        override render(_context: BuildContext) {
          return "test";
        }
      })();
      const element = new MockElement(mockComponent);
      element.context = new MockBuildContext();

      setActiveElement(element);
      expect(() => {
        useState(0);
      }).not.toThrow();
      setActiveElement(null);
    });

    test("should reset hook index when setting active element", () => {
      const mockComponent = new (class extends Component {
        override render(_context: BuildContext) {
          return "test";
        }
      })();
      const element = new MockElement(mockComponent);
      element.context = new MockBuildContext();

      setActiveElement(element);
      const idx1 = getHookIndex();
      const idx2 = getHookIndex();
      setActiveElement(null);

      expect(idx1).toBe(0);
      expect(idx2).toBe(1);

      // Reset
      setActiveElement(element);
      const idx3 = getHookIndex();
      setActiveElement(null);

      expect(idx3).toBe(0);
    });

    test("should return current active element", () => {
      const mockComponent = new (class extends Component {
        override render(_context: BuildContext) {
          return "test";
        }
      })();
      const element = new MockElement(mockComponent);
      element.context = new MockBuildContext();

      setActiveElement(element);
      const active = getActiveElement();
      setActiveElement(null);

      expect(active).toBe(element);
    });
  });

  describe("useState Hook", () => {
    test("should initialize state with initial value", () => {
      const mockComponent = new (class extends Component {
        override render(_context: BuildContext) {
          return "test";
        }
      })();
      const element = new MockElement(mockComponent);
      element.context = new MockBuildContext();

      setActiveElement(element);
      const [value] = useState(42);
      setActiveElement(null);

      expect(value).toBe(42);
    });

    test("should return same state on subsequent renders", () => {
      const mockComponent = new (class extends Component {
        override render(_context: BuildContext) {
          return "test";
        }
      })();
      const element = new MockElement(mockComponent);
      element.context = new MockBuildContext();

      // First render
      setActiveElement(element);
      const [value1, setState] = useState(10);
      setState(20);
      setActiveElement(null);

      // Second render
      setActiveElement(element);
      const [value2] = useState(10);
      setActiveElement(null);

      expect(value1).toBe(10);
      expect(value2).toBe(20);
    });

    test("should update state with new value", () => {
      const mockComponent = new (class extends Component {
        override render(_context: BuildContext) {
          return "test";
        }
      })();
      const element = new MockElement(mockComponent);
      element.context = new MockBuildContext();
      let markBuildCalled = false;
      element.markNeedsBuild = () => {
        markBuildCalled = true;
      };

      setActiveElement(element);
      const [, setState] = useState(5);
      setState(15);
      setActiveElement(null);

      expect(markBuildCalled).toBe(true);
    });

    test("should update state with updater function", () => {
      const mockComponent = new (class extends Component {
        override render(_context: BuildContext) {
          return "test";
        }
      })();
      const element = new MockElement(mockComponent);
      element.context = new MockBuildContext();

      setActiveElement(element);
      const [, setState] = useState(10);
      setState((prev) => prev + 5);
      setActiveElement(null);

      // Re-render to get updated value
      setActiveElement(element);
      const [value] = useState(10);
      setActiveElement(null);

      expect(value).toBe(15);
    });

    test("should not trigger rebuild if value is the same", () => {
      const mockComponent = new (class extends Component {
        override render(_context: BuildContext) {
          return "test";
        }
      })();
      const element = new MockElement(mockComponent);
      element.context = new MockBuildContext();
      let markBuildCalled = false;
      element.markNeedsBuild = () => {
        markBuildCalled = true;
      };

      setActiveElement(element);
      const [, setState] = useState(5);
      setState(5); // Same value
      setActiveElement(null);

      expect(markBuildCalled).toBe(false);
    });

    test("should handle multiple useState calls", () => {
      const mockComponent = new (class extends Component {
        override render(_context: BuildContext) {
          return "test";
        }
      })();
      const element = new MockElement(mockComponent);
      element.context = new MockBuildContext();

      setActiveElement(element);
      const [count] = useState(0);
      const [name] = useState("test");
      const [active] = useState(true);
      setActiveElement(null);

      expect(count).toBe(0);
      expect(name).toBe("test");
      expect(active).toBe(true);
    });

    test("should maintain separate state for different hooks", () => {
      const mockComponent = new (class extends Component {
        override render(_context: BuildContext) {
          return "test";
        }
      })();
      const element = new MockElement(mockComponent);
      element.context = new MockBuildContext();

      // First render
      setActiveElement(element);
      const [, setCount] = useState(0);
      const [, setName] = useState("");
      setCount(10);
      setName("updated");
      setActiveElement(null);

      // Second render
      setActiveElement(element);
      const [count] = useState(0);
      const [name] = useState("");
      setActiveElement(null);

      expect(count).toBe(10);
      expect(name).toBe("updated");
    });
  });

  describe("useEffect Hook", () => {
    test("should create effect hook with dependencies", () => {
      const mockComponent = new (class extends Component {
        override render(_context: BuildContext) {
          return "test";
        }
      })();
      const element = new MockElement(mockComponent);
      element.context = new MockBuildContext();

      setActiveElement(element);
      useEffect(() => {
        // Effect function
      }, []);
      setActiveElement(null);

      const hooks = element.hooks;
      expect(hooks.length).toBe(1);
      expect(hooks[0].deps).toEqual([]);
      expect(hooks[0].pending).toBe(true);
    });

    test("should mark effect as pending when dependencies change", () => {
      const mockComponent = new (class extends Component {
        override render(_context: BuildContext) {
          return "test";
        }
      })();
      const element = new MockElement(mockComponent);
      element.context = new MockBuildContext();

      // First render
      setActiveElement(element);
      useEffect(() => {}, [1]);
      setActiveElement(null);

      // Second render with changed deps
      setActiveElement(element);
      useEffect(() => {}, [2]);
      setActiveElement(null);

      const hooks = element.hooks;
      expect(hooks[0].pending).toBe(true);
    });

    test("should not mark effect as pending when dependencies are the same", () => {
      const mockComponent = new (class extends Component {
        override render(_context: BuildContext) {
          return "test";
        }
      })();
      const element = new MockElement(mockComponent);
      element.context = new MockBuildContext();

      // First render
      setActiveElement(element);
      useEffect(() => {}, [1, "test"]);
      setActiveElement(null);

      // Manually mark as not pending (simulating effect run)
      element.hooks[0].pending = false;

      // Second render with same deps
      setActiveElement(element);
      useEffect(() => {}, [1, "test"]);
      setActiveElement(null);

      const hooks = element.hooks;
      expect(hooks[0].pending).toBe(false);
    });

    test("should handle effect without dependencies (runs every time)", () => {
      const mockComponent = new (class extends Component {
        override render(_context: BuildContext) {
          return "test";
        }
      })();
      const element = new MockElement(mockComponent);
      element.context = new MockBuildContext();

      setActiveElement(element);
      useEffect(() => {});
      setActiveElement(null);

      // First effect should be pending
      expect(element.hooks[0].pending).toBe(true);

      // Mark as not pending
      element.hooks[0].pending = false;

      // Second render
      setActiveElement(element);
      useEffect(() => {});
      setActiveElement(null);

      // Should be pending again
      expect(element.hooks[0].pending).toBe(true);
    });

    test("should store cleanup function", () => {
      const mockComponent = new (class extends Component {
        override render(_context: BuildContext) {
          return "test";
        }
      })();
      const element = new MockElement(mockComponent);
      element.context = new MockBuildContext();

      const cleanup = () => {};
      setActiveElement(element);
      useEffect(() => cleanup, []);
      setActiveElement(null);

      expect(element.hooks[0].effect()).toBe(cleanup);
    });

    test("should handle multiple useEffect calls", () => {
      const mockComponent = new (class extends Component {
        override render(_context: BuildContext) {
          return "test";
        }
      })();
      const element = new MockElement(mockComponent);
      element.context = new MockBuildContext();

      setActiveElement(element);
      useEffect(() => {}, [1]);
      useEffect(() => {}, [2]);
      useEffect(() => {}, [3]);
      setActiveElement(null);

      expect(element.hooks.length).toBe(3);
      expect(element.hooks[0].deps).toEqual([1]);
      expect(element.hooks[1].deps).toEqual([2]);
      expect(element.hooks[2].deps).toEqual([3]);
    });
  });

  describe("Hook State Management", () => {
    test("should initialize hooks array on first access", () => {
      const mockComponent = new (class extends Component {
        override render(_context: BuildContext) {
          return "test";
        }
      })();
      const element = new MockElement(mockComponent);
      element.context = new MockBuildContext();

      setActiveElement(element);
      const hooks = getHookState();
      setActiveElement(null);

      expect(Array.isArray(hooks)).toBe(true);
      expect(hooks.length).toBe(0);
    });

    test("should return same hooks array on subsequent calls", () => {
      const mockComponent = new (class extends Component {
        override render(_context: BuildContext) {
          return "test";
        }
      })();
      const element = new MockElement(mockComponent);
      element.context = new MockBuildContext();

      setActiveElement(element);
      const hooks1 = getHookState();
      const hooks2 = getHookState();
      setActiveElement(null);

      expect(hooks1).toBe(hooks2);
    });
  });
});
