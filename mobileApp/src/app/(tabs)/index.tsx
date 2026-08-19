import {
  Text,
  ActivityIndicator,
  View,
  FlatList,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useGetUserChatList } from "../../../hooks/useChat";
import { useRouter } from "expo-router";
import { ChatItem } from "../../../components/ChatItem";
import { ChatHeader } from "../../../components/ChatHeader";
import EmptyUI from "../../../components/EmptyUI";
import { Chat } from "../../../types";

const ChatsScreen = () => {
  const router = useRouter();
  const {
    data: userChatList,
    isLoading,
    error,
  } = useGetUserChatList();

  const handleChatPress = (item: Chat) => {
    router.push({
      pathname: "/chat/[id]",
      params: {
        id: item._id,
        participantId: item.participant._id,
        name: item.participant.name,
        avatar: item.participant.avatar,
      },
    });
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-surface items-center justify-center">
        <ActivityIndicator size={"large"} color={"#f4A261"} />
      </View>
    );
  }

  const refetch = () => {};

  if (error) {
    return (
      <View className="flex-1 bg-surface items-center justify-center">
        <Text className="text-red-500 text-2xl">Failed to load chats</Text>
        <Pressable
          onPress={() => refetch()}
          className="mt-4 px-4 py-2 bg-primary rounded-lg"
        >
          <Text className="text-foreground">Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-surface">
      {/* we can add contentInsetAdjustmentBehavior="automatic" to resovle the safe area issue but it will not work on android. */}
      {/* <ScrollView contentInsetAdjustmentBehavior="automatic">
        <Text className="text-white">ChatsScreen</Text>
        <Button title='Try!' onPress={ () => { Sentry.captureException(new Error('First error')) }}/>
      </ScrollView> */}
      <FlatList
        data={userChatList}
        keyExtractor={(item) => item._id}
        renderItem={(item: Chat) => (
          <ChatItem chat={item} onPress={() => handleChatPress(item)} />
        )}
        ListHeaderComponent={<ChatHeader />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: 24,
        }}
        ListEmptyComponent={() =>
          !userChatList?.length &&
          !isLoading && (
            <EmptyUI
              title="No chat found!"
              subtitle="Start new chat!"
              buttonLabel="New chat"
              onPressButton={() => {}}
            />
          )
        }
      />
    </SafeAreaView>
  );
};

export default ChatsScreen;
