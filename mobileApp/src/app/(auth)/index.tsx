import { View, Text, useWindowDimensions, Pressable, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useSocialAuth } from "../../../hooks/useSocialAuth";


const LoginScreen = () => {
  const { width, height } = useWindowDimensions();
  
  const { loading, handleSocialAuth } = useSocialAuth();
  const isLoading  = loading !== null;

  return (
    <View className="flex-1  bg-surface-dark">
      <View></View>
      <SafeAreaView className="flex-1 ">
        <View className="items-center pt-10">
          <Image
            source={require("../../../assets/images/logo-chat.png")}
            style={{ width: 100, height: 100, marginVertical: -20 }}
            contentFit="contain"
          />
          <Text className="text-white text-4xl font-bold text-primary font-serif tracking-wider uppercase">
            nexora
          </Text>
        </View>

        <View className="flex-1 justify-center items-center px-6">
          <Image
            source={require("../../../assets/images/auth-chat.png")}
            style={{ width: width - 48, height: height * 0.3 }}
            contentFit="contain"
          />
          <View className="mt-6 items-center">
            <Text className="text-5xl font-bold text-foreground text-center font-sans">
              Connect & Chat
            </Text>
            <Text className="text-3xl font-bold text-primary font-mono">
              Seamlessly
            </Text>
          </View>
          <View className="flex-row gap-4 mt-10">
            <Pressable
              className="flex-1 flex-row items-center justify-center gap-2 bg-white/95 py-4 rounded-2xl active:scale-[0.98]"
              disabled={isLoading}
              onPress={() => handleSocialAuth("oauth_google")}
            >
              {loading === "oauth_google" ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
              <Image
                source={require("../../../assets/images/google-chat.png")}
                  style={{ width: 20, height: 20 }}
                  contentFit="contain"
                />
              )}
              <Text className="text-grey-900 font-semibold text-sm">
                Google
              </Text>
            </Pressable>
            <Pressable
              className="flex-1 flex-row items-center justify-center gap-2 bg-white/10 py-4 rounded-2xl active:scale-[0.98]"
              disabled={isLoading}
              onPress={() => handleSocialAuth("oauth_apple")}
            >
              {loading === "oauth_apple" ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
              <Ionicons name="logo-apple" size={20} color="white" />
              )}
              <Text className="text-foreground font-semibold text-sm">
                Apple
              </Text>
            </Pressable>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
};

export default LoginScreen;
