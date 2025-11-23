import {
  Component,
  HTMLComponent,
  useState,
  ClientComponent,
  ServerComponent,
} from "@skyjt/breact";

@ClientComponent()
export class Counter extends Component {
  override render() {
    // useState MUST be called inside render(), not in setup()
    const [count, setCount] = useState(0);

    return new HTMLComponent(
      "div",
      {
        style: { border: "1px solid #ccc", padding: "10px", margin: "10px" },
      },
      [
        new HTMLComponent("h3", {}, ["CSR Component (Counter)"]),
        new HTMLComponent("p", {}, [`Count: ${count}`]),
        new HTMLComponent(
          "button",
          {
            onclick: () => setCount((c: number) => c + 1),
          },
          ["Increment"]
        ),
      ]
    );
  }
}

@ServerComponent()
export class ServerMessage extends Component {
  message: string;
  constructor(message: string) {
    super();
    this.message = message;
  }
  override render() {
    return new HTMLComponent(
      "div",
      { style: { background: "#f0f0f0", padding: "10px" } },
      [
        new HTMLComponent("h3", {}, ["SSR Component"]),
        new HTMLComponent("p", {}, [this.message]),
      ]
    );
  }
}

export class Navigation extends Component {
  override render() {
    return new HTMLComponent("nav", { style: { marginBottom: "20px" } }, [
      new HTMLComponent("a", { href: "/", style: { marginRight: "10px" } }, [
        "Home (SSR Page)",
      ]),
      new HTMLComponent(
        "a",
        { href: "/dashboard", style: { marginRight: "10px" } },
        ["Dashboard (CSR Page)"]
      ),
    ]);
  }
}
