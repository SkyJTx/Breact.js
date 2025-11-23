/**
 * Breact Framework - Modular Architecture
 *
 * This file serves as the main entry point that re-exports all framework
 * components from their dedicated modules for better organization and
 * maintainability.
 *
 * Module Structure:
 * - types.ts       : Core type definitions and interfaces
 * - context.ts     : BuildContext abstraction
 * - component.ts   : Component base class and HTMLComponent
 * - element.ts     : Element abstraction for rendering
 * - hooks.ts       : Hooks system (useState, useEffect, useRoute, useRouter)
 * - decorators.ts  : Component decorators (@css, @scss, @sass, etc.)
 */

// Type definitions
export type {
  Child,
  StyleDefinition,
  StyleProcessor,
  Component as IComponent,
  BuildContext as IBuildContext,
} from "./types";

// Core abstractions
export { BuildContext } from "./context";
export { Component, HTMLComponent } from "./component";
export { Element } from "./element";

// Hooks system
export {
  setActiveElement,
  getActiveElement,
  getHookState,
  getHookIndex,
  setRouterContext,
  getRouterContext,
  useState,
  useEffect,
  useRoute,
  useRouter,
  type RouterNavigation,
} from "./hooks";

// Router
export { Router, RouterComponent, type Route, type RouteInfo } from "./router";

// Decorators
export {
  ServerComponent,
  ClientComponent,
  css,
  scss,
  sass,
} from "./decorators";
