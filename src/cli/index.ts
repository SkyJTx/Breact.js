#!/usr/bin/env bun
import { mkdir } from "node:fs/promises";
import { join } from "path";

const args = process.argv.slice(2);
const projectName = args[0] || "my-breact-app";
const template = args[1] || "blank"; // blank | example
const targetDir = join(process.cwd(), projectName);

console.log(`Creating Breact.js app (${template}) in ${targetDir}...`);

await mkdir(targetDir, { recursive: true });

const commonDependencies = {
  elysia: "latest",
  "@elysiajs/swagger": "latest",
};

const commonDevDependencies = {
  "bun-types": "latest",
};

if (template === "example") {
  // Create Example Project
  await mkdir(join(targetDir, "src", "shared"), { recursive: true });
  await mkdir(join(targetDir, "public"), { recursive: true });

  const packageJson = {
    name: projectName,
    module: "src/server.ts",
    type: "module",
    scripts: {
      dev: "bun run --watch src/server.ts",
      "build:client":
        "bun build ./src/client.ts --outdir ./public --target browser",
    },
    dependencies: commonDependencies,
    devDependencies: commonDevDependencies,
  };

  await Bun.write(
    join(targetDir, "package.json"),
    JSON.stringify(packageJson, null, 2)
  );

  // tsconfig.json
  const tsconfig = {
    compilerOptions: {
      lib: ["ESNext", "DOM"],
      module: "esnext",
      target: "esnext",
      moduleResolution: "bundler",
      strict: true,
      jsx: "react-jsx",
      allowImportingTsExtensions: true,
      noEmit: true,
    },
  };
  await Bun.write(
    join(targetDir, "tsconfig.json"),
    JSON.stringify(tsconfig, null, 2)
  );

  // src/shared/components.ts
  const componentsTs = `
import { Component, HTMLComponent, useState, ClientComponent, ServerComponent } from 'breact.js';

@ClientComponent()
export class Counter extends Component {
    render() {
        const [count, setCount] = useState(0);
        return new HTMLComponent('div', { style: { border: '1px solid #ccc', padding: '10px', margin: '10px' } }, [
            new HTMLComponent('h3', {}, ['CSR Component (Counter)']),
            new HTMLComponent('p', {}, [\`Count: \${count}\`]),
            new HTMLComponent('button', { onclick: () => setCount(c => c + 1) }, ['Increment'])
        ]);
    }
}

@ServerComponent()
export class ServerMessage extends Component {
    message: string;
    constructor(message: string) {
        super();
        this.message = message;
    }
    render() {
        return new HTMLComponent('div', { style: { background: '#f0f0f0', padding: '10px' } }, [
            new HTMLComponent('h3', {}, ['SSR Component']),
            new HTMLComponent('p', {}, [this.message])
        ]);
    }
}

export class Navigation extends Component {
    render() {
        return new HTMLComponent('nav', { style: { marginBottom: '20px' } }, [
            new HTMLComponent('a', { href: '/', style: { marginRight: '10px' } }, ['Home (SSR Page)']),
            new HTMLComponent('a', { href: '/dashboard', style: { marginRight: '10px' } }, ['Dashboard (CSR Page)']),
        ]);
    }
}
`;
  await Bun.write(join(targetDir, "src/shared/components.ts"), componentsTs);

  // src/shared/pages.ts
  const pagesTs = `
import { Component, HTMLComponent } from 'breact.js';
import { Counter, ServerMessage, Navigation } from './components.ts';

export class HomePage extends Component {
    render() {
        return new HTMLComponent('div', {}, [
            new Navigation(),
            new HTMLComponent('h1', {}, ['Home Page (SSR)']),
            new HTMLComponent('p', {}, ['This page is rendered on the server.']),
            new ServerMessage('Hello from the server!'),
            new Counter() // Hydrated on client
        ]);
    }
}

export class DashboardPage extends Component {
    render() {
        return new HTMLComponent('div', {}, [
            new Navigation(),
            new HTMLComponent('h1', {}, ['Dashboard (CSR)']),
            new HTMLComponent('p', {}, ['This page is interactive.']),
            new Counter(),
            new Counter()
        ]);
    }
}
`;
  await Bun.write(join(targetDir, "src/shared/pages.ts"), pagesTs);

  // src/shared/routes.ts
  const routesTs = `
import { Router } from 'breact.js';
import { HomePage, DashboardPage } from './pages.ts';

export const router = new Router([
    { path: '/', component: () => new HomePage() },
    { path: '/dashboard', component: () => new DashboardPage() }
]);
`;
  await Bun.write(join(targetDir, "src/shared/routes.ts"), routesTs);

  // src/client.ts
  const clientTs = `
import { render, RouterComponent } from 'breact.js';
import { router } from './shared/routes.ts';

console.log('Hydrating...');
const path = window.location.pathname;
render(new RouterComponent(router, path), document.body);
`;
  await Bun.write(join(targetDir, "src/client.ts"), clientTs);

  // src/server.ts
  const serverTs = `
import { Elysia } from 'elysia';
import { swagger } from '@elysiajs/swagger';
import { renderToString, RouterComponent } from 'breact.js';
import { router } from './shared/routes.ts';

const app = new Elysia()
    .use(swagger())
    .get('/api/data', () => ({ message: "Data from API" }))
    .get('/public/client.js', async () => {
        const build = await Bun.build({
            entrypoints: ['./src/client.ts'],
            target: 'browser',
        });
        return new Response(build.outputs[0]);
    })
    .get('*', ({ request }) => {
        const url = new URL(request.url);
        const html = renderToString(new RouterComponent(router, url.pathname));
        
        return new Response(\`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Breact App</title>
            </head>
            <body>
                \${html}
                <script type="module" src="/public/client.js"></script>
            </body>
            </html>
        \`, { headers: { 'Content-Type': 'text/html' } });
    })
    .listen(3000);

console.log(\`🦊 Server running at \${app.server?.hostname}:\${app.server?.port}\`);
`;
  await Bun.write(join(targetDir, "src/server.ts"), serverTs);
} else {
  // Blank Project
  const packageJson = {
    name: projectName,
    module: "index.ts",
    type: "module",
    dependencies: commonDependencies,
    devDependencies: commonDevDependencies,
  };

  await Bun.write(
    join(targetDir, "package.json"),
    JSON.stringify(packageJson, null, 2)
  );

  const indexTs = `
import { app } from 'breact.js';

app.listen(3000);
console.log('Server running on http://localhost:3000');
`;
  await Bun.write(join(targetDir, "index.ts"), indexTs);
}

console.log("Done! Run:");
console.log("  (Make sure you ran 'bun link' in the Breact.js folder first)");
console.log(`cd ${projectName}`);
console.log("bun install");
console.log("bun link breact.js");
if (template === "example") {
  console.log("bun run dev");
} else {
  console.log("bun run index.ts");
}
