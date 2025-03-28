#!/usr/bin/env node
import { unlink } from "node:fs";
import { withFullScreen } from "fullscreen-ink";
import { App } from "./app.js";
import { LOGFILE } from "./lib/log.js";

unlink(LOGFILE, (error) => {
  if (error) {
    console.error(error);
  }
});
const ink = withFullScreen(<App />);
ink.start();
await ink.waitUntilExit();
console.log("jira time is over :(");
process.exit(0); // Not sure why it doen't quit on it's own, but we'll help it out
