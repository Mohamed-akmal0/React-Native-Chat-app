import { View, Text, Pressable } from "react-native";
import { Chat, User } from "../types";
import { Image } from "expo-image";
import { formatDistanceToNow } from "date-fns";

export const ChatItem = ({
  chat,
  onPress,
}: {
  chat: Chat;
  onPress: () => void;
}) => {
  const participant = chat?.otherParticipant;
  const lastMessage = chat?.lastMessage;
  const lastMessageTime = chat?.lastMessageAt;

  const isOnline = true;
  const istyping = false;
  const hasUnread = false;

  return (
    <Pressable
      className="flex-row items-cneter py-3 active:opacity-70 "
      onPress={onPress}
    >
      <View className="relatvie">
        <Image
          source={{ uri: participant?.avatar }}
          style={{ width: 56, height: 56, borderRadius: 99 }}
        />
        <View className="absolute bottom-0 right-0 size-4 bg-green-500 rounded-full border-[3px border-surface" />
      </View>

      {/* chat info */}

      <View className="flex-1 ml-4">
        <View className="flex-row items-center justify-between">
          <Text
            className={` text-base font-medium ${hasUnread ? "text-primary" : "text-foreground"}`}
          >
            {participant?.name}
          </Text>
          <View className="flex-row items-center gap-2">
            {hasUnread && (
              <View className="1-2.5 h-2.5 bg-primary rounded-full" />
            )}
            <Text className="text-xs text-subtle-foregrond">
              {lastMessageTime
                ? formatDistanceToNow(new Date(lastMessageTime), {
                    addSuffix: false,
                  })
                : ""}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center justify-bwetween mt-1">
          {istyping ? (
            <Text className="text-sm bg-primary italic">typing...</Text>
          ) : (
            <Text
              className={`text-sm flex-1 mr-3 ${hasUnread ? "text-foregournd font-medium" : "text-subtle-foreground"}`}
              numberOfLines={1}
            >
              {lastMessage?.text || "No Message yet"}
            </Text>
          )}
        </View>
      </View>
    </Pressable>
  );
};
