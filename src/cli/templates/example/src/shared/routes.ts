import { Router } from "@skyjt/breact";
import { HomePage, DashboardPage } from "./pages";

export const router = new Router([
  { path: "/", component: () => new HomePage() },
  { path: "/dashboard", component: () => new DashboardPage() },
]);
