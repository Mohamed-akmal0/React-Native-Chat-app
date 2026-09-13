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
}) {
  const bubbleRef = useRef<View>(null);

  const handlePress = () => {
    if (!isFromMe) return;

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
      className={`flex-row items-center w-full ${isSelected ? "bg-white/10" : ""}`}
      onLongPress={() => {
        if (isFromMe) {
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
            color={isSelected ? "#22C55E" : "#A0A0A5"}
          />
        </View>
      ) : null}
      <View
        className={`flex-1 flex-row ${isFromMe ? "justify-end" : "justify-start"}`}
      >
        <View
          ref={bubbleRef}
          collapsable={false}
          className={`max-w-[80%] px-3 py-2 rounded-2xl ${
            isFromMe
              ? "bg-primary rounded-br-sm"
              : "bg-surface-card rounded-bl-sm border border-surface-light"
          }`}
        >
          <Text
            className={`text-sm ${isFromMe ? "text-surface-dark" : "text-foreground"}`}
          >
            {message}
          </Text>
          {isEditted && (
            <Text className="text-[10px] text-foreground ">Editted</Text>
          )}
        </View>
      </View>
    </Pressable>
  );
}

export default MessageBubble;
