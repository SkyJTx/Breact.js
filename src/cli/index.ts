#!/usr/bin/env node
import { mkdir, cp, readFile, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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

async function createExampleProject({ projectName, targetDir }: CreateOptions) {
  // Copy template files
  const templateDir = join(__dirname, "templates", "example");
  await cp(templateDir, targetDir, { recursive: true });

  // Update package.json with project name
  const pkgPath = join(targetDir, "package.json");
  const pkgContent = await readFile(pkgPath, "utf-8");
  const updatedPkg = pkgContent.replace("{{projectName}}", projectName);
  await writeFile(pkgPath, updatedPkg);
}

async function createBlankProject({ projectName, targetDir }: CreateOptions) {
  // Copy template files
  const templateDir = join(__dirname, "templates", "blank");
  await cp(templateDir, targetDir, { recursive: true });

  // Update package.json with project name
  const pkgPath = join(targetDir, "package.json");
  const pkgContent = await readFile(pkgPath, "utf-8");
  const updatedPkg = pkgContent.replace("{{projectName}}", projectName);
  await writeFile(pkgPath, updatedPkg);
}

async function installDependencies(targetDir: string) {
  logSection("Installing dependencies");
  logInfo("Running bun install...");

  return new Promise<void>((resolve) => {
    const install = spawn("bun", ["install"], {
      cwd: targetDir,
      stdio: "inherit",
    });

    install.on("close", (code) => {
      if (code !== 0) {
        exitWithError(
          "bun install failed. Fix the errors above or rerun with --skip-install."
        );
      }
      logSuccess("Dependencies installed");
      resolve();
    });

    install.on("error", (err) => {
      exitWithError(`Failed to start bun install: ${err.message}`);
    });
  });
}
