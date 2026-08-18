import { useSSO } from "@clerk/expo";
import { useState } from "react";
import { Alert } from "react-native";

export const useSocialAuth = () => {
  const [loading, setLoading] = useState<string | null>(null);
  const { startSSOFlow } = useSSO();

  const handleSocialAuth = async (strategy: "oauth_google" | "oauth_apple") => {
    setLoading(strategy);
    try {
      const { createdSessionId, setActive } = await startSSOFlow({ strategy });
      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId });
      }else{
        const provider = strategy === "oauth_google" ? "Google" : "Apple";
        Alert.alert(
          "Error",
          `Failed to sign in with ${provider}. Please try again.`,
        );
        setLoading(null);
      }
    } catch (error) {
      console.log("error in social auth", error);
      const provider = strategy === "oauth_google" ? "Google" : "Apple";
      Alert.alert(
        "Error",
        `Failed to sign in with ${provider}. Please try again.`,
      );
    } finally {
      setLoading(null);
    }
  };

  return { loading, handleSocialAuth };
};
