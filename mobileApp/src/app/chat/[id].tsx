import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Text,
  View,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  LayoutRectangle,
  Keyboard,
} from "react-native";
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
import { useCurrentUser } from "../../../hooks/useUsers";
import { useDeleteMessage, useEditMessage, useMessages } from "../../../hooks/useMessages";
import { useSocketStore } from "../../../lib/socketStore";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import EmptyUI from "../../../components/EmptyUI";
import MessageBubble from "../../../components/MessageBubble";
import {
  decryptMessage,
  encryptMessage,
  getPrivateKey,
} from "../../../lib/encrypt";
import { useUser } from "@clerk/expo";
import MessageActions from "../../../components/MessageActions";
import { FlashList, FlashListRef } from "@shopify/flash-list";
import DeleteModal from "../../../components/DeleteModal";
import Loader from "../../../components/Loader";

type ChatDetailsParams = {
  id: string;
  participantId: string;
  name: string;
  avatar: string;
  publicKey: string;
};

const ChatDetailScreen = () => {
  const router = useRouter();
  const { user } = useUser();
  const insets = useSafeAreaInsets();

  const {
    id: chatId,
    participantId,
    name,
    avatar,
    publicKey,
  } = useLocalSearchParams<ChatDetailsParams>();

  const { data: currentUserData } = useCurrentUser();
  const { data: messageData, isLoading } = useMessages(chatId);
  const { mutateAsync: editMessageMutation } =
    useEditMessage(chatId);
  const {mutateAsync: deleteMutation} = useDeleteMessage();

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
  const [secretKey, setSecretKey] = useState<string | null>(null);
  const [editMessage, setEditMessage] = useState<string | null>(null);
  const [selectedMessage, setSelectedMessage] = useState<string | null>(null);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(
    null,
  );
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [showMessageActionsHeader, setShowMessageActionsHeader] =
    useState(false);
  const [showMessageAction, setShowMessageAction] = useState(false);
  const [actionAnchor, setActionAnchor] = useState<LayoutRectangle | null>(
    null,
  );
  const [actionIsFromMe, setActionIsFromMe] = useState(false);
  const [isEditting, setIsEditting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const flashListRef = useRef<FlashListRef<any>>(null);
  const isSelectionMode = selectedIds.length > 0;
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  useEffect(() => {
    const showEvent =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const show = Keyboard.addListener(showEvent, () =>
      setIsKeyboardVisible(true),
    );
    const hide = Keyboard.addListener(hideEvent, () =>
      setIsKeyboardVisible(false),
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  useEffect(() => {
    if (selectedIds.length === 0) {
      setShowMessageActionsHeader(false);
    }
  }, [selectedIds]);

  //join chat on mount and leave on unmount
  useEffect(() => {
    if (chatId && isConnected) {
      joinChat(chatId);
    }

    return () => {
      if (chatId) leaveChat(chatId);
    };
  }, [joinChat, leaveChat, isConnected, chatId]);

  //loading current user secrete key
  useEffect(() => {
    if (!user?.id) return;
    getPrivateKey(user.id).then((key) => {
      if (key) setSecretKey(key);
    });
  }, [user?.id]);

  //scroll to bottom when new messages arrive
  useEffect(() => {
    if (messageData) {
      setTimeout(() => {
        flashListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messageData]);

  const decryptedMessages = useMemo(() => {
    if (!messageData || !secretKey || !publicKey) return [];

    return messageData?.map((message: any) => {
      const senderId =
        typeof message.senderId === "string"
          ? message.senderId
          : message.senderId?._id;
      const isFromMe = Boolean(
        currentUserData?._id && senderId === currentUserData._id,
      );

      const theirPublicKey = isFromMe
        ? publicKey
        : typeof message.senderId === "string"
          ? publicKey
          : (message.senderId?.publicKey ?? publicKey);

      const plaintext =
        message.plaintext ??
        decryptMessage(
          message.cipherText,
          message.nonce,
          theirPublicKey,
          secretKey,
        );

      return { ...message, isFromMe, plaintext };
    });
  }, [messageData, secretKey, publicKey, currentUserData?._id]);

  const handleUserTyping = useCallback(
    (text: string) => {
      if (isEditting) {
        // * if we are editting no need to trigger the typing event
        setEditMessage(text);
        return;
      } else {
        setMessageText(text);
        if (!isConnected || !chatId) return;
        if (text.length > 0) {
          //sending typing event
          sendTyping(chatId, true);
          //clearing existing typing timeout
          if (typingTimoutRef.current) {
            {
              clearTimeout(typingTimoutRef.current);
            }
          }
          //stop typing after 2 sec of no input
          typingTimoutRef.current = setTimeout(() => {
            sendTyping(chatId, false);
          }, 2000);
        }
      }
    },
    [isConnected, sendTyping, chatId, isEditting],
  );

  const handleSubmit = async () => {
    const text = (isEditting ? editMessage : messageText)?.trim();
    if (!text || !chatId || !currentUserData || isSending) return;
    if (!secretKey) return;
    const encrypted = encryptMessage(text, publicKey, secretKey);
    if (!encrypted) return;
    setIsSending(true);
    sendTyping(chatId, false);
    try {
      if (editingMessageId) {
        // REST edit
        await editMessageMutation({
          messageId: editingMessageId,
          cipherText: encrypted.cipherText,
          nonce: encrypted.nonce,
        });
        setEditingMessageId(null);
        setIsEditting(false);
        setEditMessage(null);
      } else {
        // socket send
        if (!isConnected) return;
        sendMessage(
          chatId,
          { cipherText: encrypted.cipherText, nonce: encrypted.nonce },
          {
            _id: currentUserData._id,
            name: currentUserData.name,
            email: currentUserData.email,
            avatar: currentUserData.avatar,
          },
        );
      }
      setMessageText("");
    } finally {
      setIsSending(false);
    }
  };

  //this is for selecting multiple messages and show the message actions in the header
  //if the user selects only one, then we can show the edit or else only delete button and the count
  const handleMessageLongPress = (message: string, messageId: string) => {
    setEditMessage(message);
    setShowMessageAction(false);
    setShowMessageActionsHeader(true);
    setSelectedIds((ids) =>
      ids.includes(messageId) ? ids : [...ids, messageId],
    );
  };

  const handleOnPress = (
    messageId: string,
    message: string,
    anchor: LayoutRectangle,
    isFromMe: boolean,
  ) => {
    setSelectedMessageId(messageId);
    setSelectedMessage(message);
    setActionAnchor(anchor);
    setActionIsFromMe(isFromMe);
    setShowMessageAction(true);
  };

  const startEditing = (messageId: string, message: string) => {
    setEditMessage(message);
    setEditingMessageId(messageId);
    setIsEditting(true);
    setSelectedIds([]);
    setShowMessageActionsHeader(false);
    setShowMessageAction(false);
  };

  //for deletion
  const toggleMessageSelection = (messageId: string) => {
    setSelectedIds((ids) =>
      ids.includes(messageId)
        ? ids.filter((id) => id !== messageId)
        : [...ids, messageId],
    );
  };

  const handleDeleteIconPress = () => {
    setIsDeleting(true);
    // setShowHardDeleteModal(true);
  };

  const handleDelete = async (deleteForEveryone: boolean) => {
    const deleteType = deleteForEveryone ? "hard" : "soft";
    const ids =
      selectedIds.length > 0
        ? selectedIds
        : selectedMessageId
          ? [selectedMessageId]
          : [];
    if (!ids.length) return;
    try {
      await deleteMutation({
        messageIds: ids,
        typeOfDelete: deleteType,
      });
      setIsDeleting(false);
      setSelectedIds([]);
      setShowMessageActionsHeader(false);
    } catch (error) {
      console.log("err in handle delete", error);
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleting(false);
  };

  return (
    <SafeAreaView className="flex-1" edges={["top"]}>
      {showMessageActionsHeader ? (
        <View className="flex-row items-center px-3 py-2 gap-2 bg-surface">
          <Pressable
            onPress={() => {
              setSelectedIds([]);
              setShowMessageActionsHeader(false);
            }}
            className="w-11 h-11 rounded-full items-center justify-center bg-surface-overlay"
          >
            <Ionicons name="close" size={22} color="#7C6FF7" />
          </Pressable>

          <View className="flex-1 h-11 rounded-full bg-surface-overlay justify-center px-5">
            <Text className="text-white text-base font-medium">
              {selectedIds.length} Selected
            </Text>
          </View>

          <View className="h-11 rounded-full bg-surface-overlay flex-row items-center px-4 gap-4">
            {/* {selectedIds.length === 1 && (<Pressable className="active:opacity-70" onPress={() => handleOnPress()} >
              <Ionicons name="pencil-outline" size={20} color="#FFFFFF" />
            </Pressable>)} */}

            {selectedIds.length === 1 && (
              <Pressable
                className="active:opacity-70"
                onPress={() => {
                  const messageId = selectedIds[0];
                  const selected = decryptedMessages.find(
                    (message: any) => message._id === messageId,
                  );
                  if (!selected) return;
                  startEditing(messageId, selected.plaintext || " ");
                }}
              >
                <Ionicons name="pencil-outline" size={20} color="#FFFFFF" />
              </Pressable>
            )}

            <Pressable className="active:opacity-70">
              <Ionicons name="copy-outline" size={20} color="#FFFFFF" />
            </Pressable>
            {/* <Pressable className="active:opacity-70">
              <Ionicons name="arrow-forward-outline" size={20} color="#FFFFFF" />
            </Pressable> */}
            <Pressable
              className="active:opacity-70"
              onPress={handleDeleteIconPress}
            >
              <Ionicons name="trash-outline" size={20} color="#FFFFFF" />
            </Pressable>
          </View>
        </View>
      ) : (
        <View className="flex-row items-center px-4 py-2 bg-surface border-b border-surface-light">
          {/* Header */}
          <Pressable onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#7C6FF7" />
          </Pressable>
          <View className="flex-row items-center flex-1 ml-2">
            {avatar && (
              <Image
                source={avatar}
                style={{ width: 40, height: 40, borderRadius: 999 }}
              />
            )}
            <View className="ml-3">
              <Text
                className="text-foreground font-semibold text-base"
                numberOfLines={1}
              >
                {name}
              </Text>
              <Text
                className={`text-xs ${isTyping ? "text-primary" : "text-muted-foreground"}`}
              >
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
      )}

      <DeleteModal
        visible={isDeleting}
        count={selectedIds.length > 0 ? selectedIds?.length : 1}
        onCancel={handleDeleteCancel}
        onDelete={handleDelete}
        participantName={name}
      />

      {showMessageAction && actionAnchor && selectedMessage && (
        <MessageActions
          setIsDeleting={setIsDeleting}
          setIsEditting={setIsEditting}
          setShowMessageAction={setShowMessageAction}
          anchor={actionAnchor}
          isFromMe={actionIsFromMe}
          setEditMessage={setEditMessage}
          selectedMessage={selectedMessage}
          setEditingMessageId={setEditingMessageId}
          selectedMessageId={selectedMessageId}
          setSelectedIds={setSelectedIds}
        />
      )}

      {/* Message + Keyboard input */}

      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        <View className="flex-1 bg-surface">
          {isLoading ? (
            <View className="flex-1 items-center justify-center">
              <Loader size="large" color="#F4A261" />
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
            <FlashList
              data={decryptedMessages}
              keyExtractor={(item: any) => item?._id}
              renderItem={({ item }) => (
                <MessageBubble
                  messageId={item._id}
                  message={item.plaintext || " "}
                  isFromMe={item.isFromMe}
                  isSelected={selectedIds.includes(item._id)}
                  isSelectionMode={isSelectionMode}
                  onLongPress={handleMessageLongPress}
                  onPress={handleOnPress}
                  onToggleSelect={toggleMessageSelection}
                  isEditted={item.isEditted}
                  isSoftDelete={item.isSoftDelete}
                  isHardDelete={item.isHardDelete}
                />
              )}
              ItemSeparatorComponent={() => <View style={{ height: 2.5 }} />}
              contentContainerStyle={{
                paddingHorizontal: 16,
                paddingVertical: 12,
                gap: 8,
              }}
              ref={flashListRef}
              onContentSizeChange={() => {
                flashListRef.current?.scrollToEnd({ animated: true });
              }}
              bounces={false}
            />
          )}

          {/* Input bar */}
          <View
            className="px-3 pt-2 bg-surface border-t border-surface-light"
            style={{
              paddingBottom: isKeyboardVisible
                ? 12
                : Math.max(insets.bottom, 12),
            }}
          >
            <View className="flex-row items-end bg-surface-card rounded-3xl px-3 py-1.5 gap-2">
              <Pressable className="w-8 h-8 rounded-full items-center justify-center">
                <Ionicons name="add" size={22} color="#7C6FF7" />
              </Pressable>

              <TextInput
                placeholder="Type a message"
                placeholderTextColor="#7C6FF7"
                className="flex-1 text-foreground text-sm mb-2"
                multiline
                style={{ maxHeight: 100 }}
                value={isEditting ? (editMessage ?? "") : messageText}
                onChangeText={handleUserTyping}
                onSubmitEditing={handleSubmit}
                editable={!isSending}
              />

              <Pressable
                className="w-8 h-8 rounded-full items-center justify-center bg-primary"
                onPress={handleSubmit}
                disabled={
                  isSending ||
                  !(isEditting ? editMessage?.trim() : messageText.trim())
                }
              >
                {isSending ? (
                  <Loader size="small" color="#0D0D0F" />
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
