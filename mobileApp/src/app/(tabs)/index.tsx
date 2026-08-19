import { ScrollView, Text, Button } from "react-native";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Sentry from "@sentry/react-native"

const ChatsScreen = () => {
  return (
    <SafeAreaView className="flex-1 bg-surface">
      {/* we can add contentInsetAdjustmentBehavior="automatic" to resovle the safe area issue but it will not work on android. */}
      <ScrollView contentInsetAdjustmentBehavior="automatic">
        <Text className="text-white">ChatsScreen</Text>
        <Button title='Try!' onPress={ () => { Sentry.captureException(new Error('First error')) }}/>
      </ScrollView>
    </SafeAreaView>
  );
};

export default ChatsScreen;
