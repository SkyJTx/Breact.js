import {
  Component,
  HTMLComponent,
  Router,
  RouterComponent,
  app,
  renderToString,
} from "../../index.ts";
import { useState } from "../../src/shared/framework.ts";

class Counter extends Component {
  render() {
    const [count, setCount] = useState(0);

    return new HTMLComponent("div", {}, [
      new HTMLComponent("h1", {}, [`Count: ${count}`]),
      new HTMLComponent(
        "button",
        {
          onclick: () => setCount((c) => c + 1),
        },
        ["Increment"]
      ),
    ]);
  }
}

class HomePage extends Component {
  render() {
    return new HTMLComponent("div", {}, [
      new HTMLComponent("h1", {}, ["Home Page"]),
      new Counter(),
    ]);
  }
}

const router = new Router([{ path: "/", component: () => new HomePage() }]);

// Server Side Rendering Example
app.get("/", () => {
  const html = renderToString(new RouterComponent(router, "/"));
  return new Response(html, { headers: { "Content-Type": "text/html" } });
});

if (import.meta.main) {
  app.listen(3000);
  console.log("Example app running on http://localhost:3000");
}
