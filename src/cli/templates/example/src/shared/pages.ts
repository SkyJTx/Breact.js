import { Component, HTMLComponent } from "@skyjt/breact";
import { Counter, ServerMessage, Navigation } from "./components";

export class HomePage extends Component {
  override render() {
    return new HTMLComponent("div", {}, [
      new Navigation(),
      new HTMLComponent("h1", {}, ["Home Page (SSR)"]),
      new HTMLComponent("p", {}, ["This page is rendered on the server."]),
      new ServerMessage("Hello from the server!"),
      new Counter(),
    ]);
  }
}

export class DashboardPage extends Component {
  override render() {
    return new HTMLComponent("div", {}, [
      new Navigation(),
      new HTMLComponent("h1", {}, ["Dashboard (CSR)"]),
      new HTMLComponent("p", {}, ["This page is interactive."]),
      new Counter(),
      new Counter(),
    ]);
  }
}
