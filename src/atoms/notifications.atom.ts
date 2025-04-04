import { atom } from "jotai";

export type Notification = {
  message: string;
  type: "info" | "success" | "warning" | "error";
};

export const notificationsAtom = atom<Notification[]>([]);
