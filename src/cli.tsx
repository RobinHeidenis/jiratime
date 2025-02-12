#!/usr/bin/env node
import { withFullScreen } from "fullscreen-ink";
import React from "react";
import { App } from "./app.js";

const ink = withFullScreen(<App />);
ink.start();
await ink.waitUntilExit();
