import { BoardView } from "../board-view.js";
import { Onboarding } from "./onboarding/onboarding.js";

export type Route = {
  key: string;
  component: () => JSX.Element;
};

export const ROUTES = [
  {
    key: "onboarding",
    component: () => <Onboarding />,
  },
  {
    key: "board",
    component: () => <BoardView />,
  },
] as const satisfies Route[];

export type KnownRoute = (typeof ROUTES)[number]["key"];
