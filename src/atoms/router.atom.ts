import { atom } from "jotai";
import { env } from "../env.js";
import type { KnownRoute } from "../routes/routes.js";

export const routeAtom = atom<KnownRoute>(
  env.onboarded ? "board" : "onboarding",
);
