import {Text, ScrollView, Pressable } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@clerk/expo";
import { useUserProfile } from "../../../hooks/useAuthentication";

const profile = () => {
  const {signOut} = useAuth();
  const {data: userData} = useUserProfile();
  // console.log('user data', userData);
  return (
    <SafeAreaView className="flex-1 bg-surface">
      <ScrollView >
        <Text className="text-white">ProfileScreen</Text>
        <Pressable onPress={() => signOut()} className="mt-4 px-4 py-2 bg-red-500 rounded-lg">
          <Text className="text-white">signout</Text> 
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
};

export default profile;
