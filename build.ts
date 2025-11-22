#!/usr/bin/env bun
/**
 * Breact.js Build Script
 * Builds the library and CLI with proper TypeScript support
 */

import { spawn } from "bun";
import { rm, copyFile } from "node:fs/promises";

async function run(command: string, args: string[]) {
  const proc = spawn([command, ...args], {
    stdio: ["inherit", "inherit", "inherit"],
    cwd: process.cwd(),
  });
  const code = await proc.exited;
  return code;
}

async function build() {
  console.log("🏗️  Building Breact.js...\n");

  // Clean dist folder
  console.log("Cleaning dist folder...");
  try {
    await rm("dist", { recursive: true });
  } catch {
    // ignore
  }

  // Type check
  console.log("Type checking...");
  const checkCode = await run("bun", ["tsc", "--noEmit"]);
  if (checkCode !== 0) {
    console.error("❌ Type checking failed");
    process.exit(1);
  }

  // Build library
  console.log("\nBuilding library...");
  const libCode = await run("bun", [
    "build",
    "./index.ts",
    "--outdir",
    "./dist",
    "--format",
    "esm",
  ]);
  if (libCode !== 0) {
    console.error("❌ Library build failed");
    process.exit(1);
  }

  // Build CLI
  console.log("\nBuilding CLI...");
  const cliCode = await run("bun", [
    "build",
    "./src/cli/index.ts",
    "--outdir",
    "./dist/cli",
    "--format",
    "esm",
    "--external:node:fs/promises",
    "--external:path",
  ]);
  if (cliCode !== 0) {
    console.error("❌ CLI build failed");
    process.exit(1);
  }

  // Copy package.json, README, and LICENSE
  console.log("\nCopying metadata files...");

  // Update package.json exports for publishing from dist/
  const pkg = await Bun.file("package.json").json();

  // Fix paths - remove ./dist/ prefix since we publish from dist folder
  pkg.main = "./index.js";
  pkg.module = "./index.js";
  pkg.types = "./index.d.ts";
  pkg.exports = {
    ".": {
      import: "./index.js",
      types: "./index.d.ts",
    },
    "./client": {
      import: "./client/index.js",
      types: "./client/index.d.ts",
    },
    "./server": {
      import: "./server/index.js",
      types: "./server/index.d.ts",
    },
    "./shared": {
      import: "./shared/index.js",
      types: "./shared/index.d.ts",
    },
  };

  // Remove files array as we're publishing entire dist folder
  delete pkg.files;

  // Remove build scripts from published package
  delete pkg.scripts.build;
  delete pkg.scripts["build:lib"];
  delete pkg.scripts["build:cli"];
  delete pkg.scripts.prepublishOnly;
  delete pkg.devDependencies;

  await Bun.write("dist/package.json", JSON.stringify(pkg, null, 2));
  console.log("  ✓ package.json (with fixed paths)");

  try {
    await copyFile("README.md", "dist/README.md");
    console.log("  ✓ README.md");
  } catch {
    console.warn("  ⚠ README.md not found");
  }

  try {
    await copyFile("LICENSE", "dist/LICENSE");
    console.log("  ✓ LICENSE");
  } catch {
    console.warn("  ⚠ LICENSE not found");
  }

  console.log("\n✅ Build complete!");
  console.log("\nNext steps:");
  console.log("  1. npm publish dist/");
  console.log(
    "  2. Or npm publish dist/ --access public (for scoped packages)"
  );
}

build().catch((err) => {
  console.error(err);
  process.exit(1);
});
