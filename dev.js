import { spawn } from "node:child_process";

const child = spawn(
  "node",
  ["--import", "@swc-node/register/esm-register", "--watch", "src/cli.tsx"],
  {
    stdio: "inherit",
    env: { ...process.env, SWCRC: "true" },
  },
);

// Manually listen for ctrl+c, as there's something in watch mode in combination with ink's useInput that's
// preventing the process from terminating properly.
// It just hangs on "Completed running 'dist/cli.js', after which ctrl+c doesn't even close anything
function listenForCtrlC() {
  process.stdin.resume();
  process.stdin.setEncoding("utf8");
  process.stdin.setRawMode(true);
  process.stdin.on("data", (key) => {
    if (key === "\u0003") {
      child.kill("SIGTERM");
      process.exit();
    }
  });
}

listenForCtrlC();

process.on("SIGINT", () => {
  child.kill("SIGINT");
});

process.on("SIGTERM", () => {
  child.kill("SIGTERM");
});
