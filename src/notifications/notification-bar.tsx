import figures from "figures";
import { Box, Text } from "ink";
import { useAtomValue } from "jotai";
import {
  type Notification,
  notificationsAtom,
} from "../atoms/notifications.atom.js";
import { useStdoutDimensions } from "../useStdoutDimensions.js";

const icons = {
  info: figures.info,
  success: figures.tick,
  warning: figures.warning,
  error: figures.cross,
} as const satisfies Record<Notification["type"], string>;

const colors = {
  info: "blue",
  success: "green",
  warning: "yellow",
  error: "red",
} as const satisfies Record<Notification["type"], string>;

const MAX_NOTIFICATIONS_SHOWN = 5;

export const NotificationBar = () => {
  const notifications = useAtomValue(notificationsAtom).slice(
    -MAX_NOTIFICATIONS_SHOWN,
  );
  const [columns] = useStdoutDimensions();

  if (!notifications.length) {
    return null;
  }

  const longestNotification = Math.max(
    ...notifications.map((notification) => notification.message.length),
  );
  const maxWidth = Math.min(longestNotification + 8, 40);

  return (
    <Box
      flexDirection="column"
      position="absolute"
      marginLeft={columns - maxWidth - 4}
      marginTop={1}
    >
      {notifications.map((notification, index) => (
        <NotificationToast
          // biome-ignore lint/suspicious/noArrayIndexKey: no alternative
          key={index}
          notification={notification}
        />
      ))}
    </Box>
  );
};

const NotificationToast = ({
  notification: { type, message },
}: { notification: Notification }) => {
  const color = colors[type];

  return (
    <Box flexDirection="column" borderStyle="round" borderColor={color}>
      <Box>
        <Text>{"  "}</Text>
        <Box flexShrink={0} marginRight={0}>
          <Text color={color}>{icons[type]}</Text>
        </Box>
        {/* Hack to prevent the underlying elements from showing through */}
        <Box marginLeft={-1}>
          <Text> </Text>
        </Box>
        <Text>{`${message}  `}</Text>
      </Box>
    </Box>
  );
};
