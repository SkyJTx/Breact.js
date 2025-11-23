import {
  Component,
  BuildContext,
  type Child,
  HTMLComponent,
  setRouterContext,
} from "./framework.ts";

// Route information object returned by useRoute()
export interface RouteInfo<TParams = Record<string, unknown>> {
  path: string;
  route: Route<TParams>;
}

export type Route<TParams = Record<string, unknown>> = {
  path: string;
  component: (params?: TParams) => Component;
};

export class Router<TRoutes extends readonly Route<any>[] = Route[]> {
  routes: TRoutes;

  constructor(routes: TRoutes) {
    this.routes = routes;
  }

  match(path: string): Component | null {
    const route = this.routes.find((r) => r.path === path); // Simple exact match
    return route ? route.component() : null;
  }

  getRoute(path: string) {
    return this.routes.find((r) => r.path === path);
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

  override render(_context: BuildContext): Child {
    const route = this.router.getRoute(this.currentPath);

    // Set router context for useRoute and useRouter hooks
    setRouterContext(
      this.router,
      route ? { path: this.currentPath, route } : null
    );

    const component = this.router.match(this.currentPath);
    if (!component) return new HTMLComponent("div", {}, ["404 Not Found"]);
    return component;
  }
}
