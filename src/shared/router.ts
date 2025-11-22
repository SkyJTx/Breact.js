import {
  Component,
  BuildContext,
  type Child,
  HTMLComponent,
} from "./framework.ts";

export type Route = {
  path: string;
  component: () => Component;
};

export class Router {
  routes: Route[] = [];

  constructor(routes: Route[]) {
    this.routes = routes;
  }

  match(path: string): Component | null {
    const route = this.routes.find((r) => r.path === path); // Simple exact match
    return route ? route.component() : null;
  }
}

export class RouterComponent extends Component {
  router: Router;
  currentPath: string;

  constructor(router: Router, initialPath: string = "/") {
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
