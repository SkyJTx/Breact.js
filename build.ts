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
    "--sourcemap=external",
    "--minify-whitespace",
    "--minify-syntax",
    "--external:node:fs",
  ]);
  if (libCode !== 0) {
    console.error("❌ Library build failed");
    process.exit(1);
  }

  // Generate TypeScript declarations
  console.log("\nGenerating TypeScript declarations...");
  const dtsCode = await run("bun", ["tsc", "--project", "tsconfig.build.json"]);
  if (dtsCode !== 0) {
    console.error("❌ Declaration generation failed");
    process.exit(1);
  }

  // Fix declaration file paths (remove .ts extensions and fix src paths)
  console.log("\nFixing declaration file paths...");
  const { readdir, readFile, writeFile } = await import("node:fs/promises");
  const { join } = await import("path");

  async function fixDtsFiles(dir: string) {
    const entries = await readdir(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);

      if (entry.isDirectory()) {
        await fixDtsFiles(fullPath);
      } else if (entry.name.endsWith(".d.ts")) {
        let content = await readFile(fullPath, "utf-8");
        // Remove .ts extensions from imports
        content = content.replace(
          /from\s+['"](\.\.?\/[^'"]+)\.ts['"]/g,
          'from "$1"'
        );
        // Fix src/ paths in root index.d.ts
        content = content.replace(/from\s+['"]\.\/src\//g, 'from "./');
        await writeFile(fullPath, content, "utf-8");
      }
    }
  }

  await fixDtsFiles("dist");

  // Reorganize dist structure - move src/* to dist/
  console.log("\nReorganizing dist structure...");
  const { rename: renameAsync } = await import("node:fs/promises");

  // Move dist/src/client -> dist/client
  // Move dist/src/server -> dist/server
  // Move dist/src/shared -> dist/shared
  try {
    await renameAsync("dist/src/client", "dist/client");
    await renameAsync("dist/src/server", "dist/server");
    await renameAsync("dist/src/shared", "dist/shared");
    // Remove empty src directory
    await rm("dist/src", { recursive: true });
    console.log("  ✓ Moved src/* to root");
  } catch (e) {
    console.warn("  ⚠ Could not reorganize dist structure:", e);
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
    "--target",
    "node",
    "--external:node:fs/promises",
    "--external:path",
  ]);
  if (cliCode !== 0) {
    console.error("❌ CLI build failed");
    process.exit(1);
  }

  // Copy CLI templates
  console.log("\nCopying CLI templates...");
  const { cp } = await import("node:fs/promises");
  try {
    await cp("src/cli/templates", "dist/cli/templates", { recursive: true });
    console.log("  ✓ Templates copied");
  } catch (e) {
    console.warn("  ⚠ Could not copy templates:", e);
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

  // Fix bin path for published package (relative to dist folder)
  pkg.bin = {
    breact: "./cli/index.js",
  };

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
