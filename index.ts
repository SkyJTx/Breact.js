import {
  Component,
  HTMLComponent,
  useState,
  useWatch,
  useWatchEffect,
  useEffect,
  useRoute,
  useRouter,
  ClientComponent,
  ServerComponent,
  css,
  scss,
  sass,
  type BuildContext,
  type Child,
} from "./src/shared/framework.ts";
import { Router, RouterComponent, type Route } from "./src/shared/router.ts";
import { renderToString } from "./src/server/ssr.ts";
import { render } from "./src/client/dom.ts";
import {
  app,
  startHMRServer,
  getHMRClientScript,
  generateHMRClientScript,
} from "./src/server/index.ts";

export {
  Component,
  HTMLComponent,
  useState,
  useWatch,
  useWatchEffect,
  useEffect,
  useRoute,
  useRouter,
  ClientComponent,
  ServerComponent,
  css,
  scss,
  sass,
  Router,
  RouterComponent,
  renderToString,
  render,
  app,
  startHMRServer,
  getHMRClientScript,
  generateHMRClientScript,
};

export type { BuildContext, Child, Route };
