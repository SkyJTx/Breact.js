/**
 * Hot Module Reload (HMR) Server
 * Runs on a separate port and handles file watching and client notifications
 */

import { Elysia } from "elysia";

const HMR_PORT = 3001;
const hmrClients = new Set<ReadableStreamDefaultController>();
let buildVersion = Date.now();

export interface HMROptions {
  /** Directory to watch for changes */
  watchDir?: string;
  /** File extensions to watch */
  extensions?: string[];
  /** Client build configuration */
  clientBuild?: {
    entrypoint: string;
    outdir: string;
  };
  /** Callback when files change */
  onRebuild?: () => Promise<void> | void;
}

export async function startHMRServer(options: HMROptions = {}) {
  const {
    watchDir = "./src",
    extensions = [".ts", ".tsx", ".js", ".jsx"],
    clientBuild,
    onRebuild,
  } = options;

  // Dynamic import to avoid bundling node:fs
  const { watch } = await import("node:fs");

  // Watch for file changes
  watch(watchDir, { recursive: true }, async (_eventType, filename) => {
    if (filename && extensions.some((ext) => filename.endsWith(ext))) {
      console.log(`🔄 [HMR] File changed: ${filename}`);
      buildVersion = Date.now();

      // Rebuild client if configured
      if (clientBuild) {
        try {
          await Bun.build({
            entrypoints: [clientBuild.entrypoint],
            target: "browser",
            outdir: clientBuild.outdir,
            minify: true,
          });
          console.log(`✅ [HMR] Client rebuilt`);
        } catch (error) {
          console.error(`❌ [HMR] Build failed:`, error);
        }
      }

      // Custom rebuild callback
      if (onRebuild) {
        await onRebuild();
      }

      // Notify all connected clients
      hmrClients.forEach((controller) => {
        try {
          controller.enqueue(`data: ${buildVersion}\n\n`);
        } catch {
          hmrClients.delete(controller);
        }
      });
    }
  });

  // Start HMR server on separate port
  const hmrServer = new Elysia()
    .all("/*", ({ set }) => {
      // Add CORS headers to allow cross-origin requests
      set.headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      };
    })
    .get("/", () => {
      const stream = new ReadableStream({
        start(controller) {
          hmrClients.add(controller);
          controller.enqueue(`data: connected\n\n`);
        },
        cancel() {
          hmrClients.delete(this as any);
        },
      });
      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
          "Access-Control-Allow-Origin": "*",
        },
      });
    })
    .listen(HMR_PORT);

  console.log(`🔥 [HMR] Server running on http://localhost:${HMR_PORT}`);
  console.log(`👀 [HMR] Watching ${watchDir} for changes`);

  return {
    port: HMR_PORT,
    version: () => buildVersion,
    stop: () => hmrServer.stop(),
  };
}

/**
 * Get HMR client script to inject into HTML
 */
export function getHMRClientScript(port: number = HMR_PORT): string {
  return `
    <script>
      (function() {
        const hmr = new EventSource('http://localhost:${port}');
        hmr.onmessage = (e) => {
          if (e.data !== 'connected') {
            console.log('🔄 [HMR] Reloading...');
            location.reload();
          }
        };
        hmr.onerror = () => {
          console.log('❌ [HMR] Connection lost, retrying...');
          setTimeout(() => location.reload(), 1000);
        };
        console.log('🔥 [HMR] Connected');
      })();
    </script>
  `;
}
