import { atom } from "jotai";
import type { KnownRoute } from "../routes/routes.js";

export const routeAtom = atom<KnownRoute>("onboarding");
