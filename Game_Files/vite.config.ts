// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    server: {
      // Vite blocks requests whose Host header isn't recognized, as a
      // dev-time DNS-rebinding protection. ngrok forwards traffic with a
      // Host header matching its own tunnel domain, so without this it
      // gets rejected before ever reaching our routes — which is why
      // Twitter's crawler (and any external fetch) was getting what
      // looked like a 404. Leading "." allows all subdomains, since
      // ngrok assigns a new random subdomain on every restart.
      allowedHosts: [".ngrok-free.dev", ".ngrok-free.app", ".ngrok.app", ".ngrok.io"],
    },
  },
});
