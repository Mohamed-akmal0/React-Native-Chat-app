import {
  View,
  Text,
  useWindowDimensions,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { Ionicons } from "@expo/vector-icons";
import { useSocialAuth } from "../../../hooks/useSocialAuth";
import { LinearGradient } from "expo-linear-gradient";
import { AnimatedOrb } from "../../../components/AnimatedOrb";
import { BlurView } from "expo-blur";
import Loader from "../../../components/Loader";

const LoginScreen = () => {
  const { width, height } = useWindowDimensions();

  const { loading, handleSocialAuth } = useSocialAuth();
  const isLoading = loading !== null;

  return (
    <View className="flex-1  bg-surface-dark">

      <View className="absolute inset-0 overflow-hidden">
        <LinearGradient
          colors={["#0A0A0C", "#11111A", "#17152B", "#0A0A0C"]}
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
          }}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />

        {/* Top-left — Indigo */}
        <AnimatedOrb
          colors={["#7C6FF7", "#6357D9"]}
          size={300}
          initialX={-80}
          initialY={height * 0.1}
          duration={4000}
        />

        {/* Top-right — Blue/Indigo */}
        <AnimatedOrb
          colors={["#6366F1", "#4F46E5"]}
          size={250}
          initialX={width - 100}
          initialY={height * 0.3}
          duration={5000}
        />

        {/* Middle — Soft Violet */}
        <AnimatedOrb
          colors={["#9B91FF", "#7C6FF7"]}
          size={200}
          initialX={width * 0.3}
          initialY={height * 0.6}
          duration={3500}
        />

        {/* Bottom-left — Blue */}
        <AnimatedOrb
          colors={["#60A5FA", "#6366F1"]}
          size={180}
          initialX={-50}
          initialY={height * 0.75}
          duration={4500}
        />

        <BlurView
          intensity={70}
          tint="dark"
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
          }}
        />
      </View>
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
                <Loader size="small" color="black" />
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
                <Loader size="small" color="white" />
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
