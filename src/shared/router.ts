import {
  Component,
  BuildContext,
  type Child,
  HTMLComponent,
} from "./framework.ts";

export type Route<TParams = any> = {
  path: string;
  component: (params?: TParams) => Component;
};

export class Router<TRoutes extends Route[] = Route[]> {
  routes: TRoutes;

  constructor(routes: TRoutes) {
    this.routes = routes;
  }

  match(path: string): Component | null {
    const route = this.routes.find((r) => r.path === path); // Simple exact match
    return route ? route.component() : null;
  }
}

export class RouterComponent<
  TRouter extends Router = Router
> extends Component {
  router: TRouter;
  currentPath: string;

  constructor(router: TRouter, initialPath: string = "/") {
    super();
    this.router = router;
    this.currentPath = initialPath;
  }

  render(_context: BuildContext): Child {
    const component = this.router.match(this.currentPath);
    if (!component) return new HTMLComponent("div", {}, ["404 Not Found"]);
    return component;
  }
}
