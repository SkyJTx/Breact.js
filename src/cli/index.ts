#!/usr/bin/env bun
const { mkdir } = await import("node:fs/promises");
const { join } = await import("path");

type Template = "blank" | "example";

const COLORS = {
  reset: "\x1b[0m",
  dim: "\x1b[2m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  bold: "\x1b[1m",
};

const symbols = {
  info: `${COLORS.cyan}➜${COLORS.reset}`,
  success: `${COLORS.green}✔${COLORS.reset}`,
  warn: `${COLORS.yellow}▲${COLORS.reset}`,
  fail: `${COLORS.red}✖${COLORS.reset}`,
};

function color(text: string, tone: keyof typeof COLORS) {
  return `${COLORS[tone]}${text}${COLORS.reset}`;
}

function logInfo(message: string) {
  console.log(`${symbols.info} ${message}`);
}

function logSuccess(message: string) {
  console.log(`${symbols.success} ${COLORS.bold}${message}${COLORS.reset}`);
}

function logSection(title: string) {
  console.log(`\n${color(title, "bold")}`);
  console.log(color("=".repeat(title.length), "dim"));
}

function exitWithError(message: string): never {
  console.error(`${symbols.fail} ${color(message, "red")}`);
  process.exit(1);
}

const args = process.argv.slice(2);
const positional = args.filter((arg) => !arg.startsWith("--"));
const flags = new Set(args.filter((arg) => arg.startsWith("--")));

const projectName = positional[0] || "my-breact-app";
const template =
  ((positional[1] || "blank").toLowerCase() as Template) || "blank";
const supportedTemplates: Template[] = ["blank", "example"];
if (!supportedTemplates.includes(template)) {
  exitWithError(
    `Unknown template: ${template}. Supported values are ${supportedTemplates.join(
      ", "
    )}.`
  );
}

const skipInstall = flags.has("--skip-install");
const targetDir = join(process.cwd(), projectName);
const commonDependencies = {
  "@skyjt/breact": "latest",
  elysia: "latest",
  "@elysiajs/swagger": "latest",
};

const commonDevDependencies = {
  "bun-types": "latest",
};

const start = Date.now();

console.log();
console.log(`${COLORS.bold}Breact.js Project Generator${COLORS.reset}`);
console.log(color("──────────────────────────", "dim"));
console.log(`${symbols.info} Project: ${color(projectName, "cyan")}`);
console.log(`${symbols.info} Template: ${color(template, "cyan")}`);
if (skipInstall) {
  console.log(`${symbols.warn} Install step skipped (use --skip-install).`);
}

await mkdir(targetDir, { recursive: true });

await createProject(template, {
  projectName,
  targetDir,
});

if (!skipInstall) {
  await installDependencies(targetDir);
}

const duration = ((Date.now() - start) / 1000).toFixed(1);

logSection("Next Steps");
console.log(`  cd ${projectName}`);
if (skipInstall) {
  console.log("  bun install");
}
console.log(template === "example" ? "  bun run dev" : "  bun run index.ts");

logSuccess(`All set in ${duration}s! Happy hacking ✨`);

type CreateOptions = {
  projectName: string;
  targetDir: string;
};

async function createProject(template: Template, options: CreateOptions) {
  logSection("Scaffolding");
  logInfo(`Creating directories in ${options.targetDir}`);

  if (template === "example") {
    await createExampleProject(options);
  } else {
    await createBlankProject(options);
  }
}

async function writeJson(path: string, data: Record<string, any>) {
  await Bun.write(path, JSON.stringify(data, null, 2));
}

async function createExampleProject({ projectName, targetDir }: CreateOptions) {
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

  await writeJson(join(targetDir, "package.json"), packageJson);

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
      types: ["bun-types"],
    },
  };

  await writeJson(join(targetDir, "tsconfig.json"), tsconfig);

  const componentsTs = `
import { Component, HTMLComponent, useState, ClientComponent, ServerComponent } from '@skyjt/breact';

@ClientComponent()
export class Counter extends Component {
    render() {
        // useState MUST be called inside render(), not as a class property
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

  const pagesTs = `
import { Component, HTMLComponent } from '@skyjt/breact';
import { Counter, ServerMessage, Navigation } from './components.ts';

export class HomePage extends Component {
    render() {
        return new HTMLComponent('div', {}, [
            new Navigation(),
            new HTMLComponent('h1', {}, ['Home Page (SSR)']),
            new HTMLComponent('p', {}, ['This page is rendered on the server.']),
            new ServerMessage('Hello from the server!'),
            new Counter()
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

  const routesTs = `
import { Router } from '@skyjt/breact';
import { HomePage, DashboardPage } from './pages.ts';

export const router = new Router([
    { path: '/', component: () => new HomePage() },
    { path: '/dashboard', component: () => new DashboardPage() }
]);
`;

  const clientTs = `
import { render, RouterComponent } from '@skyjt/breact';
import { router } from './shared/routes.ts';

// Clear server-rendered content before hydrating
document.body.innerHTML = '';

console.log('Hydrating...');
const path = window.location.pathname;
render(new RouterComponent(router, path), document.body);
`;

  const serverTs = `
import { Elysia } from 'elysia';
import { swagger } from '@elysiajs/swagger';
import { renderToString, RouterComponent } from '@skyjt/breact';
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

  await Bun.write(join(targetDir, "src/shared/components.ts"), componentsTs);
  await Bun.write(join(targetDir, "src/shared/pages.ts"), pagesTs);
  await Bun.write(join(targetDir, "src/shared/routes.ts"), routesTs);
  await Bun.write(join(targetDir, "src/client.ts"), clientTs);
  await Bun.write(join(targetDir, "src/server.ts"), serverTs);
}

async function createBlankProject({ projectName, targetDir }: CreateOptions) {
  const packageJson = {
    name: projectName,
    module: "index.ts",
    type: "module",
    dependencies: commonDependencies,
    devDependencies: commonDevDependencies,
  };

  await writeJson(join(targetDir, "package.json"), packageJson);

  const tsconfig = {
    compilerOptions: {
      lib: ["ESNext"],
      module: "esnext",
      target: "esnext",
      moduleResolution: "bundler",
      strict: true,
      allowImportingTsExtensions: true,
      noEmit: true,
      types: ["bun-types"],
    },
  };

  await writeJson(join(targetDir, "tsconfig.json"), tsconfig);

  const indexTs = `
import { app } from '@skyjt/breact';

app.listen(3000);
console.log('Server running on http://localhost:3000');
`;

  await Bun.write(join(targetDir, "index.ts"), indexTs);
}

async function installDependencies(targetDir: string) {
  logSection("Installing dependencies");
  logInfo("Running bun install...");

  const install = Bun.spawn(["bun", "install"], {
    cwd: targetDir,
    stdout: "inherit",
    stderr: "inherit",
  });

  const code = await install.exited;
  if (code !== 0) {
    exitWithError(
      "bun install failed. Fix the errors above or rerun with --skip-install."
    );
  }

  logSuccess("Dependencies installed");
}
