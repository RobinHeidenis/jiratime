import { Text } from "ink";
import { useAtomValue } from "jotai";
import { useMemo } from "react";
import { routeAtom } from "../atoms/router.atom.js";
import type { Route } from "../routes/routes.js";

export const Router = <TRoutes extends readonly Route[]>({
  routes,
}: {
  routes: TRoutes;
}) => {
  const route = useAtomValue(routeAtom);

  const CurrentComponent = useMemo(() => {
    const activeRoute = routes.find((r) => r.key === route);

    return activeRoute
      ? activeRoute.component
      : () => <Text>Route not found</Text>;
  }, [route, routes]);

  return <CurrentComponent />;
};
