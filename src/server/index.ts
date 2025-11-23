import { Elysia } from "elysia";
import { swagger } from "@elysiajs/swagger";

export const app = new Elysia().use(
  swagger({
    documentation: {
      info: {
        title: "Breact.js API",
        version: "1.0.0",
      },
    },
  })
);

export { renderToString } from "@/server/ssr.ts";
export { startHMRServer, getHMRClientScript } from "@/server/hmr.ts";
export type { HMROptions } from "@/server/hmr.ts";
