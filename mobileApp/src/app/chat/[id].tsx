import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useRef, useState } from "react";
import { ScrollView, Text, View, Pressable, ActivityIndicator, TextInput ,KeyboardAvoidingView, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useCurrentUser } from "../../../hooks/useUsers";
import { useMessages } from "../../../hooks/useMessages";
import { useSocketStore } from "../../../lib/socketStore";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { MessageSender } from "../../../types";
import EmptyUI from "../../../components/EmptyUI"
import MessageBubble from "../../../components/MessageBubble"

type ChatDetailsParams = {
  id: string;
  participantId: string;
  name: string;
  avatar: string;
};

const ChatDetailScreen = () => {
  const router = useRouter();
  const {
    id: chatId,
    participantId,
    name,
    avatar,
  } = useLocalSearchParams<ChatDetailsParams>();
  // console.log('details in chat d', id, participantId, name, avatar)

  const { data: currentUserData } = useCurrentUser();
  const { data: messageData, isLoading } = useMessages(chatId);

  const {
    isConnected,
    joinChat,
    leaveChat,
    sendMessage,
    sendTyping,
    onlineUsers,
    typingUsers,
  } = useSocketStore();

  const isOnline = onlineUsers.has(participantId);
  const isTyping = typingUsers.get(chatId) === participantId;

  //this is for tracking the user typing. if the user pause the typing of sometime, we will stop the typing event
  const typingTimoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [messageText, setMessageText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  //join chat on mount and leave on unmount
  useEffect(() => {
    if (chatId && isConnected) {
      joinChat(chatId);
    }

    return () => {
      if (chatId) leaveChat(chatId);
    };
  }, [joinChat, leaveChat, isConnected, chatId]);

  //scroll to bottom when new messages arrive
  useEffect(() => {
    if (messageData) {
      setTimeout(() => {

        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100)
    }
  }, [messageData]);

  const handleUserTyping = useCallback((text: string) => {
    setMessageText(text);
    if(!isConnected || !chatId) return
    if(text.length > 0){
      //sending typing event
      sendTyping(chatId, true)
      //clearing existing typing timeout
      if(typingTimoutRef.current){{
        clearTimeout(typingTimoutRef.current)
      }}
      //stop typing after 2 sec of no input
      typingTimoutRef.current = setTimeout(() => {
        sendTyping(chatId, false)
      }, 2000)
    }
  }, [isConnected, sendTyping, chatId]);

  const handleSendMessage = () => {
    console.log('hitting', !messageText.trim() , !isConnected , !chatId , isSending , !currentUserData)
    if(!messageText.trim() || !isConnected || !chatId || isSending || !currentUserData) return
    console.log("under if")
    if(typingTimoutRef.current){
      clearTimeout(typingTimoutRef.current)
    }
    sendTyping(chatId, false);
    setIsSending(true);
    sendMessage(chatId, messageText.trim(), {
      _id: currentUserData?._id ?? "", 
      name: currentUserData?.name ?? "",
      email: currentUserData?.email ?? "",
      avatar: currentUserData?.avatar ?? ""
    });
    setMessageText("");
    setIsSending(false);

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({animated: true})
    }, 100)
  }

  return (
    <SafeAreaView className="flex-1" edges={["bottom" ,"top"]} >
      {/* Header */}
      <View className="flex-row items-center px-4 py-2 bg-surface border-b border-surface-light">
        <Pressable onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#F4A261" />
        </Pressable>
        <View className="flex-row items-center flex-1 ml-2">
          {avatar && <Image source={avatar} style={{ width: 40, height: 40, borderRadius: 999 }} />}
          <View className="ml-3">
            <Text className="text-foreground font-semibold text-base" numberOfLines={1}>
              {name}
            </Text>
            <Text className={`text-xs ${isTyping ? "text-primary" : "text-muted-foreground"}`}>
              {isTyping ? "typing..." : isOnline ? "Online" : "Offline"}
            </Text>
          </View>
        </View>
        <View className="flex-row items-center gap-3">
          <Pressable className="w-9 h-9 rounded-full items-center justify-center">
            <Ionicons name="call-outline" size={20} color="#A0A0A5" />
          </Pressable>
          <Pressable className="w-9 h-9 rounded-full items-center justify-center">
            <Ionicons name="videocam-outline" size={20} color="#A0A0A5" />
          </Pressable>
        </View>
      </View>

      {/* Message + Keyboard input */}

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <View className="flex-1 bg-surface">
          {isLoading ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color="#F4A261" />
            </View>
          ) : !messageData || messageData?.length === 0 ? (
            <EmptyUI
              title="No messages yet"
              subtitle="Start the conversation!"
              iconName="chatbubbles-outline"
              iconColor="#6B6B70"
              iconSize={64}
            />
          ) : (
            <ScrollView
              ref={scrollViewRef}
              contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 12, gap: 8 }}
              onContentSizeChange={() => {
                scrollViewRef.current?.scrollToEnd({ animated: false });
              }}
            >
              {messageData?.map((message: any) => {
                const senderId = (message.senderId as MessageSender)._id;
                const isFromMe = currentUserData ? senderId === currentUserData._id : false;

                return <MessageBubble key={message._id} message={message} isFromMe={isFromMe} />;
              })}
            </ScrollView>
          )}

          {/* Input bar */}
          <View className="px-3 pb-3 pt-2 bg-surface border-t border-surface-light">
            <View className="flex-row items-end bg-surface-card rounded-3xl px-3 py-1.5 gap-2">
              <Pressable className="w-8 h-8 rounded-full items-center justify-center">
                <Ionicons name="add" size={22} color="#F4A261" />
              </Pressable>

              <TextInput
                placeholder="Type a message"
                placeholderTextColor="#6B6B70"
                className="flex-1 text-foreground text-sm mb-2"
                multiline
                style={{ maxHeight: 100 }}
                value={messageText}
                onChangeText={handleUserTyping}
                onSubmitEditing={handleSendMessage}
                editable={!isSending}
              />

              <Pressable
                className="w-8 h-8 rounded-full items-center justify-center bg-primary"
                onPress={handleSendMessage}
                disabled={!messageText.trim() || isSending}
              >
                {isSending ? (
                  <ActivityIndicator size="small" color="#0D0D0F" />
                ) : (
                  <Ionicons name="send" size={18} color="#0D0D0F" />
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default ChatDetailScreen;
