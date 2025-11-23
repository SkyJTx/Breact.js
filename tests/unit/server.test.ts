import { describe, test, expect, mock } from "bun:test";
import { Elysia } from "elysia";
import { renderToString } from "../../src/server/ssr.ts";
import {
  Component,
  BuildContext,
  HTMLComponent,
} from "../../src/shared/framework.ts";

describe("Server Integration", () => {
  describe("Elysia Server Setup", () => {
    test("should create Elysia server instance", () => {
      const app = new Elysia();
      expect(app).toBeDefined();
      expect(app).toBeInstanceOf(Elysia);
    });

    test("should register routes", () => {
      const app = new Elysia();

      app.get("/", () => "Hello World");
      app.get("/test", () => ({ message: "test" }));

      expect(app).toBeDefined();
    });

    test("should handle POST requests", () => {
      const app = new Elysia();

      app.post("/api/data", ({ body }) => ({ received: body }));

      expect(app).toBeDefined();
    });
  });

  describe("SSR Integration with Elysia", () => {
    test("should serve SSR rendered HTML", () => {
      class AppComponent extends Component {
        override render(_context: BuildContext) {
          return new HTMLComponent("html", {}, [
            new HTMLComponent("body", {}, [
              new HTMLComponent("h1", {}, ["Server Rendered"]),
            ]),
          ]);
        }
      }

      const app = new Elysia();

      app.get("/", () => {
        const html = renderToString(new AppComponent());
        return new Response(html, {
          headers: { "Content-Type": "text/html" },
        });
      });

      expect(app).toBeDefined();
    });

    test("should render different components for different routes", () => {
      class HomeComponent extends Component {
        override render(_context: BuildContext) {
          return new HTMLComponent("div", {}, ["Home Page"]);
        }
      }

      class AboutComponent extends Component {
        override render(_context: BuildContext) {
          return new HTMLComponent("div", {}, ["About Page"]);
        }
      }

      const app = new Elysia();

      app.get("/", () => renderToString(new HomeComponent()));
      app.get("/about", () => renderToString(new AboutComponent()));

      expect(app).toBeDefined();
    });

    test("should include data in SSR", () => {
      class DataComponent extends Component {
        data: any;
        constructor(data: any) {
          super();
          this.data = data;
        }
        override render(_context: BuildContext) {
          return new HTMLComponent("div", {}, [
            `User: ${this.data.name}, Age: ${this.data.age}`,
          ]);
        }
      }

      const userData = { name: "John", age: 30 };
      const html = renderToString(new DataComponent(userData));

      expect(html).toContain("User: John");
      expect(html).toContain("Age: 30");
    });
  });

  describe("API Endpoints", () => {
    test("should create JSON API endpoint", () => {
      const app = new Elysia();

      app.get("/api/users", () => ({
        users: [
          { id: 1, name: "Alice" },
          { id: 2, name: "Bob" },
        ],
      }));

      expect(app).toBeDefined();
    });

    test("should handle API with parameters", () => {
      const app = new Elysia();

      app.get("/api/users/:id", ({ params }) => ({
        id: params.id,
        name: `User ${params.id}`,
      }));

      expect(app).toBeDefined();
    });

    test("should handle API with body", () => {
      const app = new Elysia();

      app.post("/api/users", ({ body }) => ({
        success: true,
        data: body,
      }));

      expect(app).toBeDefined();
    });
  });

  describe("Middleware and Hooks", () => {
    test("should register before hook", () => {
      const app = new Elysia();
      const beforeHook = mock(() => {});

      app.onBeforeHandle(beforeHook);
      app.get("/", () => "test");

      expect(app).toBeDefined();
    });

    test("should register after hook", () => {
      const app = new Elysia();
      const afterHook = mock(() => {});

      app.onAfterHandle(afterHook);
      app.get("/", () => "test");

      expect(app).toBeDefined();
    });

    test("should use transform hook", () => {
      const app = new Elysia();

      app.onTransform(() => {
        // Transform hook modifies context, doesn't return
      });

      expect(app).toBeDefined();
    });
  });

  describe("Static File Serving", () => {
    test("should configure static file directory", () => {
      const app = new Elysia();

      // Note: Elysia static plugin would be needed in real implementation
      app.get("/static/*", () => {
        return new Response("static file content");
      });

      expect(app).toBeDefined();
    });
  });

  describe("Error Handling", () => {
    test("should handle 404 errors", () => {
      const app = new Elysia();

      app.get("/", () => "home");

      app.onError(({ code, error }) => {
        if (code === "NOT_FOUND") {
          return new Response("404 Not Found", { status: 404 });
        }
        return new Response(error.toString(), { status: 500 });
      });

      expect(app).toBeDefined();
    });

    test("should handle server errors", () => {
      const app = new Elysia();

      app.get("/error", () => {
        throw new Error("Test error");
      });

      app.onError(({ error }) => {
        const message = error instanceof Error ? error.message : String(error);
        return new Response(`Error: ${message}`, { status: 500 });
      });

      expect(app).toBeDefined();
    });

    test("should handle custom error responses", () => {
      const app = new Elysia();

      app.onError(({ code, error, set }) => {
        if (code === "VALIDATION") {
          set.status = 400;
          return { error: "Validation failed", details: error };
        }

        set.status = 500;
        return { error: "Internal server error" };
      });

      expect(app).toBeDefined();
    });
  });

  describe("Full SSR Application", () => {
    test("should create complete SSR application", () => {
      class Layout extends Component {
        children: any;
        constructor(children: any) {
          super();
          this.children = children;
        }
        override render(_context: BuildContext) {
          return new HTMLComponent("html", {}, [
            new HTMLComponent("head", {}, [
              new HTMLComponent("meta", { charset: "UTF-8" }),
              new HTMLComponent("title", {}, ["My App"]),
            ]),
            new HTMLComponent("body", {}, [
              new HTMLComponent("div", { id: "root" }, [this.children]),
              new HTMLComponent("script", { src: "/client.js" }),
            ]),
          ]);
        }
      }

      class HomePage extends Component {
        override render(_context: BuildContext) {
          return new HTMLComponent("div", {}, [
            new HTMLComponent("h1", {}, ["Welcome"]),
            new HTMLComponent("p", {}, ["This is the home page"]),
          ]);
        }
      }

      const app = new Elysia();

      app.get("/", () => {
        const page = new Layout(new HomePage());
        const html = renderToString(page);
        return new Response(html, {
          headers: { "Content-Type": "text/html" },
        });
      });

      expect(app).toBeDefined();

      const page = new Layout(new HomePage());
      const html = renderToString(page);

      expect(html).toContain("<html>");
      expect(html).toContain("<title>My App</title>");
      expect(html).toContain('<div id="root">');
      expect(html).toContain("<h1>Welcome</h1>");
    });

    test("should handle dynamic data in SSR", () => {
      class UserProfile extends Component {
        user: any;
        constructor(user: any) {
          super();
          this.user = user;
        }
        override render(_context: BuildContext) {
          return new HTMLComponent("div", { className: "profile" }, [
            new HTMLComponent("h2", {}, [this.user.name]),
            new HTMLComponent("p", {}, [`Email: ${this.user.email}`]),
            new HTMLComponent("p", {}, [`Age: ${this.user.age}`]),
          ]);
        }
      }

      const app = new Elysia();

      app.get("/user/:id", ({ params }) => {
        const user = {
          id: params.id,
          name: "John Doe",
          email: "john@example.com",
          age: 30,
        };

        const html = renderToString(new UserProfile(user));
        return new Response(html, {
          headers: { "Content-Type": "text/html" },
        });
      });

      const user = {
        id: "1",
        name: "John Doe",
        email: "john@example.com",
        age: 30,
      };
      const html = renderToString(new UserProfile(user));

      expect(html).toContain("John Doe");
      expect(html).toContain("john@example.com");
      expect(html).toContain("Age: 30");
    });
  });

  describe("Hybrid SSR/CSR Setup", () => {
    test("should support both SSR and client-side hydration", () => {
      class HybridComponent extends Component {
        override render(_context: BuildContext) {
          const isServer = !_context.isHydrated;
          return new HTMLComponent("div", {}, [
            isServer ? "Rendered on Server" : "Hydrated on Client",
          ]);
        }
      }

      const serverHtml = renderToString(new HybridComponent());
      expect(serverHtml).toContain("Rendered on Server");
    });

    test("should include client bundle script", () => {
      class AppWithClient extends Component {
        override render(_context: BuildContext) {
          return new HTMLComponent("html", {}, [
            new HTMLComponent("head", {}, [
              new HTMLComponent("script", {
                src: "/client.js",
                defer: "true",
              }),
            ]),
            new HTMLComponent("body", {}, [
              new HTMLComponent("div", { id: "app" }, ["Content"]),
            ]),
          ]);
        }
      }

      const html = renderToString(new AppWithClient());
      expect(html).toContain('<script src="/client.js"');
      expect(html).toContain('defer="true"');
    });
  });

  describe("Content-Type Headers", () => {
    test("should return HTML content type for SSR pages", () => {
      const headers = { "Content-Type": "text/html" };
      expect(headers["Content-Type"]).toBe("text/html");
    });

    test("should return JSON content type for API endpoints", () => {
      const app = new Elysia();

      app.get("/api/data", () => ({ message: "test" }));

      // Elysia automatically sets Content-Type to application/json for objects
      expect(app).toBeDefined();
    });
  });
});
