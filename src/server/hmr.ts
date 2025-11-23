/**
 * HMR Integration for Breact.js
 * Provides both Bun's native HMR (for CSR) and WebSocket-based HMR for SSR
 *
 * Features:
 * - Watches source files and triggers client rebuilds
 * - Runs a WebSocket server for SSR page reloads
 * - Broadcasts rebuild notifications to connected clients
 */

/**
 * Generate HMR client script for SSR pages
 * @param hmrPort - The port of the HMR WebSocket server
 * @returns JavaScript code to inject into HTML
 */
export function generateHMRClientScript(hmrPort: number): string {
  return `
<script>
  (function() {
    const HMR_PORT = ${hmrPort};
    const HMR_HOST = location.hostname;
    const WS_URL = \`ws://\${HMR_HOST}:\${HMR_PORT}/hmr\`;
    let reconnectAttempts = 0;
    const MAX_RECONNECT_ATTEMPTS = 20;
    const RECONNECT_DELAY = 1000;

    function connectHMR() {
      try {
        const ws = new WebSocket(WS_URL);

        ws.onopen = () => {
          console.log(\`🔥 [HMR] Connected to dev server on port \${HMR_PORT}\`);
          location.reload();
          reconnectAttempts = 0;
        };

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'reload') {
              console.log('🔄 [HMR] Reloading page...');
              // Small delay to ensure build is fully written
              setTimeout(() => {
                location.reload();
              }, 100);
            }
          } catch (e) {
            console.error('[HMR] Failed to parse message:', e);
          }
        };

        ws.onerror = (error) => {
          console.error(\`❌ [HMR] WebSocket error:\`, error);
        };

        ws.onclose = () => {
          console.warn(\`⚠️  [HMR] Disconnected from dev server on port \${HMR_PORT}\`);
          attemptReconnect();
        };
      } catch (error) {
        console.error('[HMR] Failed to create WebSocket:', error);
        attemptReconnect();
      }
    }

    function attemptReconnect() {
      if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttempts++;
        const delay = RECONNECT_DELAY * reconnectAttempts;
        console.log(\`⏳ [HMR] Reconnecting in \${delay}ms (attempt \${reconnectAttempts}/\${MAX_RECONNECT_ATTEMPTS})\`);
        setTimeout(connectHMR, delay);
      } else {
        console.error(\`[HMR] Failed to reconnect after \${MAX_RECONNECT_ATTEMPTS} attempts. Server may be offline.\`);
      }
    }

    // Connect when page loads
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', connectHMR);
    } else {
      connectHMR();
    }
  })();
</script>
  `.trim();
}

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
  /** Callback when files change (optional) */
  onRebuild?: () => Promise<void> | void;
  /** Port for HMR WebSocket server (optional, random if not provided) */
  hmrPort?: number;
}

export interface HMRServer {
  port: number;
  version: () => number;
  stop: () => void;
}

// Global HMR server instance to prevent port conflicts on server restarts
let globalHMRServer: any = null;

/**
 * Start HMR server with build watching and WebSocket support
 * @param options - HMR configuration options
 * @returns HMR server instance with port and control methods
 */
export async function startHMRServer(options: HMROptions = {}): Promise<HMRServer> {
  const {
    watchDir = "./src",
    extensions = [".ts", ".tsx", ".js", ".jsx"],
    clientBuild,
    onRebuild,
    hmrPort,
  } = options;

  // If HMR server is already running, reuse it
  if (globalHMRServer && !hmrPort) {
    console.log(`♻️  [HMR] Reusing existing HMR server on port ${globalHMRServer.port}`);
    return globalHMRServer;
  }

  console.log(`✅ [HMR] Starting HMR server`);

  // Import Elysia for WebSocket server
  const { Elysia } = await import("elysia");

  // Set of connected WebSocket clients
  const clients = new Set<any>();

  // Use provided port or default to 48000 for consistent port across server restarts
  // This ensures clients don't lose connection when server restarts via --watch
  const hmrServerPort = hmrPort || 48000;

  // Build function
  const rebuild = async () => {
    if (clientBuild) {
      try {
        console.log(`🔨 [HMR] Building client...`);
        await Bun.build({
          entrypoints: [clientBuild.entrypoint],
          target: "browser",
          outdir: clientBuild.outdir,
          minify: true,
        });
        console.log(`✅ [HMR] Client rebuilt`);

        // Notify all connected clients to reload
        const message = JSON.stringify({ type: "reload", timestamp: Date.now() });
        for (const client of clients) {
          try {
            client.send(message);
          } catch {
            clients.delete(client);
          }
        }
        console.log(`📢 [HMR] Broadcast reload to ${clients.size} client(s)`);
      } catch (error) {
        console.error(`❌ [HMR] Build failed:`, error);
      }
    }

    if (onRebuild) {
      await onRebuild();
    }
  };

  // Initial build to ensure client assets are up-to-date
  await rebuild();

  // Start WebSocket server for SSR HMR
  let hmrApp: any;
  try {
    hmrApp = new Elysia()
      .ws("/hmr", {
        open(ws) {
          clients.add(ws);
          console.log(`🔗 [HMR] Client connected (${clients.size} total)`);
        },
        close(ws) {
          clients.delete(ws);
          console.log(`🔌 [HMR] Client disconnected (${clients.size} remaining)`);
        },
        message(ws, message) {
          // Handle client messages (ping/heartbeat)
          if (typeof message === "string") {
            try {
              const data = JSON.parse(message);
              if (data.type === "ping") {
                ws.send(JSON.stringify({ type: "pong" }));
              }
            } catch {
              // Ignore parse errors
            }
          }
        },
      })
      .listen(hmrServerPort);
  } catch (error) {
    console.error(`❌ [HMR] Failed to start server on port ${hmrServerPort}:`, error);
    throw error;
  }

  console.log(`🔥 [HMR] WebSocket server listening on port ${hmrServerPort}`);
  console.log(
    `💡 [HMR] Connect client with: new WebSocket('ws://localhost:${hmrServerPort}/hmr')`
  );

  // Watch for file changes to trigger client rebuilds
  // Using debounce to avoid multiple rebuilds for the same file change
  const { watch } = await import("node:fs");
  let rebuildTimeout: Timer | null = null;

  console.log(`👀 [HMR] Setting up file watcher for directory: ${watchDir}`);
  
  const watcherCallback = async (_eventType: string, filename: string | null) => {
    if (!filename) return;
    
    const isValidFile = extensions.some((ext) => filename.endsWith(ext));
    if (!isValidFile) return;

    // Debounce: avoid multiple rebuilds in quick succession
    if (rebuildTimeout) clearTimeout(rebuildTimeout);
    
    rebuildTimeout = setTimeout(async () => {
      console.log(`🔄 [HMR] File changed: ${filename}`);
      await rebuild();
    }, 100);
  };

  watch(watchDir, { recursive: true }, watcherCallback);

  console.log(`✅ [HMR] File watcher initialized`);

  const hmrServer: HMRServer = {
    port: hmrServerPort,
    version: () => Date.now(),
    stop: () => {
      hmrApp.stop();
      clients.clear();
      globalHMRServer = null;
    },
  };

  // Store globally to reuse on server restart
  if (!hmrPort) {
    globalHMRServer = hmrServer;
  }

  return hmrServer;
}

/**
 * No-op function for backwards compatibility.
 * Bun's HMR is built-in and requires no client script injection.
 *
 * For custom HMR handling in your modules, use import.meta.hot directly:
 *
 * @example
 * if (import.meta.hot) {
 *   import.meta.hot.accept();
 *
 *   import.meta.hot.dispose(() => {
 *     // Cleanup before hot replacement
 *   });
 * }
 */
export function getHMRClientScript(): string {
  return "";
}
