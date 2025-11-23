import {
  Component,
  HTMLComponent,
  useState,
  useEffect,
  ClientComponent,
  ServerComponent,
  type BuildContext,
  type Child,
} from "./src/shared/framework.ts";
import { Router, RouterComponent, type Route } from "./src/shared/router.ts";
import { renderToString } from "./src/server/ssr.ts";
import { render } from "./src/client/dom.ts";
import { app } from "./src/server/index.ts";

export {
  Component,
  HTMLComponent,
  useState,
  useEffect,
  ClientComponent,
  ServerComponent,
  Router,
  RouterComponent,
  renderToString,
  render,
  app,
};

export type { BuildContext, Child, Route };
