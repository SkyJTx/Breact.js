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

export { renderToString } from "./ssr.ts";

