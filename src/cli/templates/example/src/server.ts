import { Elysia } from "elysia";
import { swagger } from "@elysiajs/swagger";
import { renderToString, RouterComponent } from "@skyjt/breact";
import { router } from "./shared/routes";

const app = new Elysia()
  .use(swagger())
  .get("/api/data", () => ({ message: "Data from API" }))
  .get("/public/client.js", async () => {
    const file = Bun.file("./public/client.js");
    if (await file.exists()) {
      return new Response(file, {
        headers: { "Content-Type": "application/javascript" },
      });
    }
    // Fallback: build on demand
    const build = await Bun.build({
      entrypoints: ["./src/client.ts"],
      target: "browser",
    });
    return new Response(build.outputs[0], {
      headers: { "Content-Type": "application/javascript" },
    });
  })
  .get("*", ({ request }) => {
    const url = new URL(request.url);
    const html = renderToString(new RouterComponent(router, url.pathname));

    return new Response(
      `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Breact App</title>
            </head>
            <body>
                ${html}
                <script type="module" src="/public/client.js"></script>
            </body>
            </html>
        `,
      { headers: { "Content-Type": "text/html" } }
    );
  })
  .listen(3000);

console.log(`🦊 Server running at ${app.server?.hostname}:${app.server?.port}`);
