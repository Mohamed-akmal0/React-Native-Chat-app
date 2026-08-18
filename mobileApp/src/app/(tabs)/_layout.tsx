import { Redirect, Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@clerk/expo";

const TabsLayout = () => {
  const { isSignedIn, isLoaded } = useAuth();
  if(!isLoaded) return null;
  if (!isSignedIn) return <Redirect href="/(auth)" />;
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#0D0D0F",
          borderTopWidth: 1,
          borderTopColor: "#1A1A1D",
          height: 80,
        },
        tabBarActiveTintColor: "#F4A261",
        tabBarInactiveTintColor: "#6B6B70",
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Chats",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "chatbubbles" : "chatbubbles-outline"}
              color={color}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons
              name={focused ? "person" : "person-outline"}
              color={color}
              size={size}
            />
          ),
        }}
      />
    </Tabs>
  );
};

export default TabsLayout;
