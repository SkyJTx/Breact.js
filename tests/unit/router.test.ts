import { describe, test, expect } from "bun:test";
import {
  Router,
  RouterComponent,
  type Route,
} from "../../src/shared/router.ts";
import {
  Component,
  BuildContext,
  HTMLComponent,
} from "../../src/shared/framework.ts";

// Mock BuildContext
class MockBuildContext extends BuildContext {
  get<T>(_type: any): T | undefined {
    return undefined;
  }
  get isHydrated(): boolean {
    return false;
  }
}

describe("Router", () => {
  describe("Router Creation", () => {
    test("should create router with routes", () => {
      const routes: Route[] = [
        {
          path: "/",
          component: () =>
            new (class extends Component {
              override render() {
                return "Home";
              }
            })(),
        },
        {
          path: "/about",
          component: () =>
            new (class extends Component {
              override render() {
                return "About";
              }
            })(),
        },
      ];

      const router = new Router(routes);
      expect(router.routes).toBe(routes);
      expect(router.routes.length).toBe(2);
    });

    test("should create router with empty routes", () => {
      const router = new Router([]);
      expect(router.routes).toEqual([]);
    });
  });

  describe("Route Matching", () => {
    test("should match exact path", () => {
      const homeComponent = () =>
        new (class extends Component {
          override render(_context: BuildContext) {
            return "Home";
          }
        })();

      const routes: Route[] = [
        { path: "/", component: homeComponent },
        {
          path: "/about",
          component: () =>
            new (class extends Component {
              override render() {
                return "About";
              }
            })(),
        },
      ];

      const router = new Router(routes);
      const matched = router.match("/");

      expect(matched).not.toBeNull();
    });

    test("should return null for non-matching path", () => {
      const routes: Route[] = [
        {
          path: "/",
          component: () =>
            new (class extends Component {
              override render() {
                return "Home";
              }
            })(),
        },
      ];

      const router = new Router(routes);
      const matched = router.match("/non-existent");

      expect(matched).toBeNull();
    });

    test("should match multiple routes", () => {
      const routes: Route[] = [
        {
          path: "/",
          component: () =>
            new (class extends Component {
              override render() {
                return "Home";
              }
            })(),
        },
        {
          path: "/about",
          component: () =>
            new (class extends Component {
              override render() {
                return "About";
              }
            })(),
        },
        {
          path: "/contact",
          component: () =>
            new (class extends Component {
              override render() {
                return "Contact";
              }
            })(),
        },
      ];

      const router = new Router(routes);

      expect(router.match("/")).not.toBeNull();
      expect(router.match("/about")).not.toBeNull();
      expect(router.match("/contact")).not.toBeNull();
    });

    test("should be case-sensitive", () => {
      const routes: Route[] = [
        {
          path: "/About",
          component: () =>
            new (class extends Component {
              override render() {
                return "About";
              }
            })(),
        },
      ];

      const router = new Router(routes);

      expect(router.match("/About")).not.toBeNull();
      expect(router.match("/about")).toBeNull();
    });

    test("should match first matching route", () => {
      let firstCalled = false;
      let secondCalled = false;

      const routes: Route[] = [
        {
          path: "/test",
          component: () => {
            firstCalled = true;
            return new (class extends Component {
              override render() {
                return "First";
              }
            })();
          },
        },
        {
          path: "/test",
          component: () => {
            secondCalled = true;
            return new (class extends Component {
              override render() {
                return "Second";
              }
            })();
          },
        },
      ];

      const router = new Router(routes);
      router.match("/test");

      expect(firstCalled).toBe(true);
      expect(secondCalled).toBe(false);
    });
  });

  describe("Route Component Factory", () => {
    test("should call component factory function", () => {
      let factoryCalled = false;
      const routes: Route[] = [
        {
          path: "/test",
          component: () => {
            factoryCalled = true;
            return new (class extends Component {
              override render(_context: BuildContext) {
                return "Test";
              }
            })();
          },
        },
      ];

      const router = new Router(routes);
      router.match("/test");

      expect(factoryCalled).toBe(true);
    });

    test("should return component instance from factory", () => {
      class TestComponent extends Component {
        override render(_context: BuildContext) {
          return "Test";
        }
      }

      const routes: Route[] = [
        { path: "/test", component: () => new TestComponent() },
      ];

      const router = new Router(routes);
      const result = router.match("/test");

      expect(result).toBeInstanceOf(TestComponent);
    });

    test("should support typed route parameters", () => {
      type UserParams = { id: string };

      const routes: Route<UserParams>[] = [
        {
          path: "/user",
          component: (params?: UserParams) => {
            return new (class extends Component {
              override render(_context: BuildContext) {
                return `User ${params?.id || "unknown"}`;
              }
            })();
          },
        },
      ];

      const router = new Router(routes);
      expect(router.routes.length).toBe(1);
    });
  });
});

describe("RouterComponent", () => {
  describe("RouterComponent Creation", () => {
    test("should create router component with default path", () => {
      const routes: Route[] = [
        {
          path: "/",
          component: () =>
            new (class extends Component {
              override render() {
                return "Home";
              }
            })(),
        },
      ];
      const router = new Router(routes);
      const routerComponent = new RouterComponent(router);

      expect(routerComponent.router).toBe(router);
      expect(routerComponent.currentPath).toBe("/");
    });

    test("should create router component with custom initial path", () => {
      const routes: Route[] = [
        {
          path: "/about",
          component: () =>
            new (class extends Component {
              override render() {
                return "About";
              }
            })(),
        },
      ];
      const router = new Router(routes);
      const routerComponent = new RouterComponent(router, "/about");

      expect(routerComponent.currentPath).toBe("/about");
    });
  });

  describe("RouterComponent Rendering", () => {
    test("should render matched component", () => {
      class HomeComponent extends Component {
        override render(_context: BuildContext) {
          return new HTMLComponent("h1", {}, ["Home Page"]);
        }
      }

      const routes: Route[] = [
        { path: "/", component: () => new HomeComponent() },
      ];
      const router = new Router(routes);
      const routerComponent = new RouterComponent(router, "/");
      const context = new MockBuildContext();

      const result = routerComponent.render(context);
      expect(result).toBeInstanceOf(HomeComponent);
    });

    test("should render 404 for non-matching path", () => {
      const routes: Route[] = [
        {
          path: "/",
          component: () =>
            new (class extends Component {
              override render() {
                return "Home";
              }
            })(),
        },
      ];
      const router = new Router(routes);
      const routerComponent = new RouterComponent(router, "/non-existent");
      const context = new MockBuildContext();

      const result = routerComponent.render(context);
      expect(result).toBeInstanceOf(HTMLComponent);

      if (result instanceof HTMLComponent) {
        expect(result.tag).toBe("div");
        expect(result.children).toContain("404 Not Found");
      }
    });

    test("should update when currentPath changes", () => {
      class HomeComponent extends Component {
        override render(_context: BuildContext) {
          return "Home";
        }
      }

      class AboutComponent extends Component {
        override render(_context: BuildContext) {
          return "About";
        }
      }

      const routes: Route[] = [
        { path: "/", component: () => new HomeComponent() },
        { path: "/about", component: () => new AboutComponent() },
      ];
      const router = new Router(routes);
      const routerComponent = new RouterComponent(router, "/");
      const context = new MockBuildContext();

      let result = routerComponent.render(context);
      expect(result).toBeInstanceOf(HomeComponent);

      routerComponent.currentPath = "/about";
      result = routerComponent.render(context);
      expect(result).toBeInstanceOf(AboutComponent);
    });
  });

  describe("RouterComponent with Different Route Types", () => {
    test("should work with various component types", () => {
      class CustomComponent extends Component {
        override render(_context: BuildContext) {
          return new HTMLComponent("div", {}, ["Custom"]);
        }
      }

      const routes: Route[] = [
        { path: "/custom", component: () => new CustomComponent() },
      ];
      const router = new Router(routes);
      const routerComponent = new RouterComponent(router, "/custom");
      const context = new MockBuildContext();

      const result = routerComponent.render(context);
      expect(result).toBeInstanceOf(CustomComponent);
    });

    test("should handle route with HTMLComponent", () => {
      const routes: Route[] = [
        {
          path: "/html",
          component: () =>
            new HTMLComponent("div", { className: "page" }, ["HTML Content"]),
        },
      ];
      const router = new Router(routes);
      const routerComponent = new RouterComponent(router, "/html");
      const context = new MockBuildContext();

      const result = routerComponent.render(context);
      expect(result).toBeInstanceOf(HTMLComponent);

      if (result instanceof HTMLComponent) {
        expect(result.tag).toBe("div");
        expect(result.props.className).toBe("page");
      }
    });
  });

  describe("RouterComponent Path Navigation", () => {
    test("should navigate between different paths", () => {
      const routes: Route[] = [
        {
          path: "/",
          component: () =>
            new (class extends Component {
              override render() {
                return "Home";
              }
            })(),
        },
        {
          path: "/page1",
          component: () =>
            new (class extends Component {
              override render() {
                return "Page1";
              }
            })(),
        },
        {
          path: "/page2",
          component: () =>
            new (class extends Component {
              override render() {
                return "Page2";
              }
            })(),
        },
      ];
      const router = new Router(routes);
      const routerComponent = new RouterComponent(router, "/");

      // Start at home
      expect(routerComponent.currentPath).toBe("/");

      // Navigate to page1
      routerComponent.currentPath = "/page1";
      expect(routerComponent.currentPath).toBe("/page1");

      // Navigate to page2
      routerComponent.currentPath = "/page2";
      expect(routerComponent.currentPath).toBe("/page2");

      // Navigate back to home
      routerComponent.currentPath = "/";
      expect(routerComponent.currentPath).toBe("/");
    });
  });

  describe("RouterComponent Edge Cases", () => {
    test("should handle empty path", () => {
      const routes: Route[] = [
        {
          path: "",
          component: () =>
            new (class extends Component {
              override render() {
                return "Empty";
              }
            })(),
        },
      ];
      const router = new Router(routes);
      const routerComponent = new RouterComponent(router, "");
      const context = new MockBuildContext();

      const result = routerComponent.render(context);
      expect(result).not.toBeInstanceOf(HTMLComponent); // Not 404
    });

    test("should handle paths with trailing slash", () => {
      const routes: Route[] = [
        {
          path: "/about/",
          component: () =>
            new (class extends Component {
              override render() {
                return "About";
              }
            })(),
        },
      ];
      const router = new Router(routes);
      const routerComponent = new RouterComponent(router, "/about/");
      const context = new MockBuildContext();

      const result = routerComponent.render(context);
      expect(result).not.toBeInstanceOf(HTMLComponent); // Not 404
    });

    test("should handle paths with query parameters (not matched)", () => {
      const routes: Route[] = [
        {
          path: "/search",
          component: () =>
            new (class extends Component {
              override render() {
                return "Search";
              }
            })(),
        },
      ];
      const router = new Router(routes);
      const routerComponent = new RouterComponent(router, "/search?q=test");
      const context = new MockBuildContext();

      const result = routerComponent.render(context);
      // Query parameters make it not match exactly
      expect(result).toBeInstanceOf(HTMLComponent); // 404
      if (result instanceof HTMLComponent) {
        expect(result.children).toContain("404 Not Found");
      }
    });
  });
});
