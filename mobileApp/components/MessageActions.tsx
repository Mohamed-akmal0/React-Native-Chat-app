import { Dispatch, SetStateAction, useMemo, useState } from "react";
import {
  View,
  Text,
  Pressable,
  Modal,
  Dimensions,
  StyleSheet,
  LayoutRectangle,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface MessageActionsProps {
  setIsEditting: Dispatch<SetStateAction<boolean>>;
  setIsDeleting: Dispatch<SetStateAction<boolean>>;
  setShowMessageAction: Dispatch<SetStateAction<boolean>>;
  setEditMessage: Dispatch<SetStateAction<null | string>>;
  selectedMessage: string;
  anchor: LayoutRectangle;
  isFromMe: boolean;
  setEditingMessageId: Dispatch<SetStateAction<null | string>>;
  selectedMessageId: string | null;
  setSelectedIds: Dispatch<SetStateAction<string[]>>;
}

const ACTIONS = [
  //   { key: "reply", label: "Reply", icon: "arrow-undo-outline" },
  { key: "copy", label: "Copy", icon: "copy-outline" },
  //   { key: "forward", label: "Forward", icon: "arrow-redo-outline" },
  { key: "pin", label: "Pin", icon: "pin-outline" },
  { key: "edit", label: "Edit", icon: "pencil-outline" },
  { key: "delete", label: "Delete", icon: "trash-outline" },
] as const;

const MENU_WIDTH = 200;
const MENU_GAP = 8;
const SCREEN_PADDING = 8;

const MessageActions = ({
  setIsEditting,
  setIsDeleting,
  setShowMessageAction,
  anchor,
  isFromMe,
  setEditMessage,
  selectedMessage,
  setEditingMessageId,
  selectedMessageId,
  setSelectedIds,
}: MessageActionsProps) => {
  const [menuHeight, setMenuHeight] = useState(320);

  const hide = () => {
    setShowMessageAction(false);
  };

  const { top, left } = useMemo(() => {
    const { width: windowWidth, height: windowHeight } =
      Dimensions.get("window");

    let nextLeft = isFromMe
      ? anchor.x - MENU_WIDTH - MENU_GAP
      : anchor.x + anchor.width + MENU_GAP;

    nextLeft = Math.max(
      SCREEN_PADDING,
      Math.min(nextLeft, windowWidth - MENU_WIDTH - SCREEN_PADDING),
    );

    let nextTop = anchor.y;
    nextTop = Math.max(
      SCREEN_PADDING,
      Math.min(nextTop, windowHeight - menuHeight - SCREEN_PADDING),
    );

    return { top: nextTop, left: nextLeft };
  }, [anchor, isFromMe, menuHeight]);

  const handlePress = (key: (typeof ACTIONS)[number]["key"]) => {
    hide();
    if (key === "edit") {
      setEditMessage(selectedMessage);
      setEditingMessageId(selectedMessageId);
      setIsEditting(true);
    }
    if (key === "delete") {
      if (selectedMessageId) {
        setSelectedIds([selectedMessageId]);
      }
      setIsDeleting(true);
    }
  };

  return (
    <Modal transparent visible animationType="fade" onRequestClose={hide}>
      <View className="flex-1" pointerEvents="box-none">
        <Pressable style={StyleSheet.absoluteFill} onPress={hide} />
        <View
          onLayout={(event) => {
            setMenuHeight(event.nativeEvent.layout.height);
          }}
          style={{
            position: "absolute",
            top,
            left,
            width: MENU_WIDTH,
          }}
          className="rounded-3xl bg-surface-overlay py-2 shadow-lg elevation-8"
        >
          {ACTIONS.map((action) => (
            <Pressable
              key={action.key}
              className="flex-row items-center px-5 py-3 active:opacity-70"
              onPress={() => handlePress(action.key)}
            >
              <Ionicons name={action.icon} size={22} color="#FFFFFF" />
              <Text className="text-white text-[15px] ml-5">
                {action.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </Modal>
  );
};

export default MessageActions;
