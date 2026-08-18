import { Stack } from "expo-router";
import "../../global.css";
import { ClerkProvider } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!; //using (!) instead of typing as a string

if (!publishableKey) {
  throw new Error("Add your Clerk Publishable Key to the .env file");
}

const queryClient = new QueryClient();

export default function RootLayout() {
  return (
    <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
      <QueryClientProvider client={queryClient}>
        <Stack screenOptions={{ headerShown: false , contentStyle: { backgroundColor: "#0D0D0F" } }}>
          <Stack.Screen name="(auth)" options={{ headerShown: false, animation: "fade" }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false, animation: "fade" }} />
        </Stack>
      </QueryClientProvider>
    </ClerkProvider>
  );
}
