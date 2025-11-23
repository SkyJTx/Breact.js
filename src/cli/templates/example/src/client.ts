import { render, RouterComponent } from "@skyjt/breact";
import { router } from "./shared/routes";

// Clear server-rendered content before hydrating
document.body.innerHTML = "";

console.log("Hydrating...");
const path = window.location.pathname;
render(new RouterComponent(router, path), document.body);
