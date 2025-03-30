import { builtinModules } from "node:module";
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
  clearScreen: false,
  plugins: [chalkForceFullColors],
  appType: "custom",
  esbuild: {
    target: "node22",
  },
  build: {
    target: "node22",
    lib: {
      fileName: "cli",
      name: "cli",
      entry: "./src/cli.tsx",
      formats: ["es"],
    },
    rollupOptions: {
      external: builtinModules.flatMap((module) => [module, `node:${module}`]), // Externalize built-in Node.js modules
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
  server: {
    watch: {
      ignored: [/.*\.txt/],
      cwd: "./src",
    },
  },
});
