import {
  type Notification,
  notificationsAtom,
} from "../atoms/notifications.atom.js";
import { store } from "../atoms/store.js";

export const showNotification = ({
  timeout = 3000,
  ...notification
}: Notification & { timeout?: number }) => {
  store.set(notificationsAtom, (notifications) => [
    ...notifications,
    notification,
  ]);

  setTimeout(() => {
    store.set(notificationsAtom, (notifications) =>
      notifications.filter((n) => n !== notification),
    );
  }, timeout);
};
