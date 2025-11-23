import { render, RouterComponent } from "@skyjt/breact";
import { router } from "./shared/routes";

// Clear server-rendered content before hydrating
document.body.innerHTML = "";

console.log("Hydrating...");
const path = window.location.pathname;
render(new RouterComponent(router, path), document.body);

// HMR support using Bun's native import.meta.hot API
if (import.meta.hot) {
  import.meta.hot.accept();

  // Re-render on hot updates to reflect component changes
  import.meta.hot.on("bun:afterUpdate", () => {
    console.log("🔄 [HMR] Re-rendering after module update");
    document.body.innerHTML = "";
    const path = window.location.pathname;
    render(new RouterComponent(router, path), document.body);
  });

  // Log when HMR connection is established
  import.meta.hot.on("bun:ws:connect", () => {
    console.log("🔥 [HMR] Connected to Bun dev server");
  });

  // Log when HMR connection is lost
  import.meta.hot.on("bun:ws:disconnect", () => {
    console.warn("❌ [HMR] Disconnected from Bun dev server");
  });
}
