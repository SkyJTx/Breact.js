// Component decorators for server/client components and styling

// Decorators for Server/Client Components
export function ServerComponent() {
  return function <T extends { new (...args: any[]): {} }>(constructor: T) {
    (constructor as any).isServer = true;
  };
}

export function ClientComponent() {
  return function <T extends { new (...args: any[]): {} }>(constructor: T) {
    (constructor as any).isClient = true;
  };
}

// Style decorators
export function css() {
  return function <T extends { new (...args: any[]): {} }>(constructor: T) {
    (constructor as any).styleProcessors = new Map([
      [(constructor as any).name, (style: string) => style],
    ]);
    return constructor;
  };
}

export function scss() {
  return function <T extends { new (...args: any[]): {} }>(constructor: T) {
    (constructor as any).styleProcessors = new Map([
      [
        (constructor as any).name,
        (style: string) => {
          // In a real implementation, this would compile SCSS to CSS
          console.warn("SCSS compilation not implemented, returning raw style");
          return style;
        },
      ],
    ]);
    return constructor;
  };
}

export function sass() {
  return function <T extends { new (...args: any[]): {} }>(constructor: T) {
    (constructor as any).styleProcessors = new Map([
      [
        (constructor as any).name,
        (style: string) => {
          // In a real implementation, this would compile SASS to CSS
          console.warn("SASS compilation not implemented, returning raw style");
          return style;
        },
      ],
    ]);
    return constructor;
  };
}
