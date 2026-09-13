import { useRef } from "react";
import { View, Text, Pressable, LayoutRectangle } from "react-native";
import { Ionicons } from "@expo/vector-icons";

function MessageBubble({
  messageId,
  message,
  isFromMe,
  onLongPress,
  onPress,
  onToggleSelect,
  isEditted,
  isSelected,
  isSelectionMode,
  isSoftDelete,
  isHardDelete,
}: {
  messageId: string;
  message: string;
  isFromMe: boolean;
  onLongPress: (message: string, messageId: string) => void;
  onPress: (
    messageId: string,
    message: string,
    anchor: LayoutRectangle,
    isFromMe: boolean,
  ) => void;
  onToggleSelect: (messageId: string) => void;
  isEditted: boolean;
  isSelected: boolean;
  isSelectionMode: boolean;
  isSoftDelete: boolean;
  isHardDelete: boolean;
}) {
  const bubbleRef = useRef<View>(null);
  const isDeletedForMe = isHardDelete || (isSoftDelete && isFromMe);
  const deletedCopy = isFromMe
    ? "You deleted this message"
    : "This message was deleted";

  const handlePress = () => {
    if (!isFromMe || isDeletedForMe) return;

    if (isSelectionMode) {
      onToggleSelect(messageId);
      return;
    }

    bubbleRef.current?.measureInWindow((x, y, width, height) => {
      onPress(messageId, message, { x, y, width, height }, isFromMe);
    });
  };

  return (
    <Pressable
      className={`flex-row items-center w-full ${
        isSelected ? "bg-white/10" : ""
      }`}
      onLongPress={() => {
        if (isFromMe && !isDeletedForMe) {
          onLongPress(message, messageId);
        }
      }}
      onPress={handlePress}
    >
      {isSelectionMode ? (
        <View className="w-7 items-center mr-2">
          <Ionicons
            name={isSelected ? "checkmark-circle" : "ellipse-outline"}
            size={22}
            color={
              isDeletedForMe
                ? "#71717A"
                : isSelected
                  ? "#4ADE80"
                  : "#71717A"
            }
          />
        </View>
      ) : null}

      <View
        className={`flex-1 flex-row ${
          isFromMe ? "justify-end" : "justify-start"
        }`}
      >
        <View
          ref={bubbleRef}
          collapsable={false}
          className={`max-w-[80%] px-3.5 py-2.5 rounded-2xl ${
            isFromMe
              ? "bg-primary rounded-br-sm"
              : "bg-surface-card rounded-bl-sm border border-border"
          }`}
        >
          <Text
            className={`text-base leading-5 ${
              isDeletedForMe
                ? isFromMe
                  ? "text-white/70 italic"
                  : "text-subtle-foreground italic"
                : isFromMe
                  ? "text-white"
                  : "text-foreground"
            }`}
          >
            {isDeletedForMe ? deletedCopy : message}
          </Text>

          {isEditted && !isDeletedForMe && (
            <Text
              className={`text-[11px] mt-0.5 ${
                isFromMe ? "text-white/50" : "text-subtle-foreground"
              }`}
            >
              Edited
            </Text>
          )}
        </View>
      </View>
    </Pressable>
  );
}

export default MessageBubble;
