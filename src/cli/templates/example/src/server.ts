import { Elysia } from "elysia";
import { swagger } from "@elysiajs/swagger";
import {
  renderToString,
  RouterComponent,
  startHMRServer,
  getHMRClientScript,
} from "@skyjt/breact";
import { router } from "./shared/routes";

const isDev = process.env.NODE_ENV !== "production";

// Start HMR server in development
let hmr: Awaited<ReturnType<typeof startHMRServer>> | null = null;
if (isDev) {
  hmr = await startHMRServer({
    watchDir: "./src",
    clientBuild: {
      entrypoint: "./src/client.ts",
      outdir: "./public",
    },
  });
}

const app = new Elysia()
  .use(swagger())
  .get("/api/data", () => ({ message: "Data from API" }))
  .get("/public/client.js", async () => {
    const file = Bun.file("./public/client.js");
    if (await file.exists()) {
      return new Response(file, {
        headers: {
          "Content-Type": "application/javascript",
          "Cache-Control": isDev ? "no-cache" : "public, max-age=31536000",
        },
      });
    }
    // Fallback: build on demand
    const build = await Bun.build({
      entrypoints: ["./src/client.ts"],
      target: "browser",
    });
    return new Response(build.outputs[0], {
      headers: {
        "Content-Type": "application/javascript",
        "Cache-Control": "no-cache",
      },
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
                <script type="module" src="/public/client.js${
                  isDev ? `?v=${hmr?.version()}` : ""
                }"></script>
                ${isDev ? getHMRClientScript() : ""}
            </body>
            </html>
        `,
      { headers: { "Content-Type": "text/html" } }
    );
  })
  .listen(3000);

console.log(
  `🦊 Server running at http://${app.server?.hostname}:${app.server?.port}`
);
