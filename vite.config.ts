import { builtinModules } from "node:module";
import react from "@vitejs/plugin-react";
import { type Plugin, defineConfig } from "vite";

/**
 * Forces chalk to use level 3 (full color support) at build time, otherwise there's no colors in the build output.
 */
const chalkForceFullColors: Plugin = {
  name: "chalk-force-full-colors",
  transform(code, id) {
    if (!id.includes("chalk")) {
      return;
    }

    return code.replace(
      /function createChalk\(options\) \{[\s\S]*?return chalkFactory\(options\);[\s\S]*?\}/,
      "function createChalk(options) { return chalkFactory({ ...options, level: 3 }); }",
    );
  },
};

export default defineConfig({
  plugins: [react(), chalkForceFullColors],
  appType: "custom",
  esbuild: {
    target: "node22", // Target Node.js 22 (or your version)
  },
  build: {
    target: "node22", // Set target to Node.js 22
    minify: false, // Disable minification to avoid mangling
    lib: {
      fileName: "cli",
      name: "cli", // Name of the library
      entry: "./src/cli.tsx", // Entry point for the app
      formats: ["es"],
    },
    rollupOptions: {
      external: [
        ...builtinModules.flatMap((module) => [module, `node:${module}`]), // Externalize built-in Node.js modules
      ],
    },
  },
  ssr: {
    target: "node",
    noExternal: ["chalk", "ink"],
  },
  optimizeDeps: {
    include: ["chalk", "ink"],
    esbuildOptions: {
      target: "node22",
      platform: "node",
    },
  },
  // define: {
  //   "process.env.FORCE_COLOR": "1", // ✅ Force color support at build time
  //   "process.env.COLORTERM": "truecolor", // Ensure full color support
  // },
});
