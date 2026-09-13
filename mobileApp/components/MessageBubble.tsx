import { useRef } from "react";
import { View, Text, Pressable, LayoutRectangle } from "react-native";

function MessageBubble({
  messageId,
  message,
  isFromMe,
  onLongPress,
  onPress,
  isEditted,
}: {
  messageId: string;
  message: string;
  isFromMe: boolean;
  onLongPress: (message: string) => void;
  onPress: (
    messageId: string,
    message: string,
    anchor: LayoutRectangle,
    isFromMe: boolean,
  ) => void;
  isEditted: boolean;
}) {
  const bubbleRef = useRef<View>(null);

  const handlePress = () => {
    if (!isFromMe) return;

    bubbleRef.current?.measureInWindow((x, y, width, height) => {
      onPress(messageId, message, { x, y, width, height }, isFromMe);
    });
  };

  return (
    <Pressable
      className={`flex-row ${isFromMe ? "justify-end" : "justify-start"}`}
      onLongPress={() => {
        if (isFromMe) {
          onLongPress(message);
        }
      }}
      onPress={handlePress}
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
    </Pressable>
  );
}

export default MessageBubble;
