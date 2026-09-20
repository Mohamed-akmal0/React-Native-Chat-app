import { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { FlashList, FlashListRef } from "@shopify/flash-list";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { AnimatedOrb } from "../../../components/AnimatedOrb";
import ModelPickerModal from "../../../components/ModelPickerModal";
import { useAiChatBot } from "../../../hooks/useChat";
import { DEFAULT_MODEL_ID, findModel } from "../../../lib/aiModels";

// Palette-derived hex values (kept in sync with mobileApp/tailwind.config.js).
// Used only where a hex is required (Ionicons/LinearGradient/placeholder).
const COLOR = {
  primary: "#7C6FF7",
  primaryLight: "#9B91FF",
  primaryDark: "#6357D9",
  surfaceBase: "#111114",
  surfaceDark: "#0A0A0C",
  surfaceLight: "#18181D",
  foreground: "#F5F5F7",
  subtleForeground: "#71717A",
} as const;

type ChatRole = "user" | "bot";

type ChatMessage = {
  id: string;
  role: ChatRole;
  text: string;
  ts: number;
  isError?: boolean;
};

const fmtTime = (n: number) =>
  new Date(n).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

// The backend streams SSE (text/event-stream). Axios buffers the whole body,
// so `data` is a string of `data: {...}\n\n` frames — we join their `text`
// fields into a single reply. If it's already a plain string or an object,
// we handle those shapes too.
const parseAiResponse = (data: unknown): string => {
  if (data == null) return "";

  if (typeof data === "object") {
    const obj = data as { text?: unknown; reply?: unknown; message?: unknown };
    if (typeof obj.text === "string") return obj.text;
    if (typeof obj.reply === "string") return obj.reply;
    if (typeof obj.message === "string") return obj.message;
    try {
      return JSON.stringify(data);
    } catch {
      return "";
    }
  }

  const raw = String(data);
  if (!raw.includes("data:")) return raw.trim();

  let out = "";
  for (const line of raw.split(/\r?\n/)) {
    const l = line.trim();
    if (!l.startsWith("data:")) continue;
    const payload = l.slice(5).trim();
    if (!payload) continue;
    try {
      const parsed = JSON.parse(payload);
      if (parsed?.isDone) continue;
      if (typeof parsed?.text === "string") out += parsed.text;
    } catch {
      out += payload;
    }
  }
  return out;
};

const AnimatedDot = ({ delay }: { delay: number }) => {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 420, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.3, { duration: 420, easing: Easing.inOut(Easing.ease) }),
        ),
        -1,
      ),
    );
  }, [delay, opacity]);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={style}
      className="w-1.5 h-1.5 rounded-full bg-primary-light"
    />
  );
};

const BotAvatar = () => (
  <View className="w-8 h-8 rounded-full items-center justify-center bg-surface-elevated border border-primary/40 mr-2">
    <Ionicons name="sparkles" size={14} color={COLOR.primaryLight} />
  </View>
);

const ThinkingBubble = () => (
  <View className="flex-row items-end mb-4">
    <BotAvatar />
    <BlurView
      intensity={50}
      tint="dark"
      className="rounded-2xl rounded-bl-sm overflow-hidden border border-border"
    >
      <View className="bg-surface-card/40 px-4 py-3 flex-row items-center gap-1.5">
        <AnimatedDot delay={0} />
        <AnimatedDot delay={150} />
        <AnimatedDot delay={300} />
      </View>
    </BlurView>
  </View>
);

const BotBubble = ({
  text,
  ts,
  isError,
}: {
  text: string;
  ts: number;
  isError?: boolean;
}) => (
  <View className="flex-row items-end mb-4">
    <BotAvatar />
    <View className="max-w-[78%]">
      <BlurView
        intensity={50}
        tint="dark"
        className="rounded-2xl rounded-bl-sm overflow-hidden border border-border"
      >
        <View className="bg-surface-card/40 px-4 py-3">
          <Text
            className={`text-base leading-5 ${
              isError ? "text-danger" : "text-foreground"
            }`}
          >
            {text}
          </Text>
        </View>
      </BlurView>
      <Text className="text-[11px] text-subtle-foreground mt-1 ml-1">
        {fmtTime(ts)}
      </Text>
    </View>
  </View>
);

const UserBubble = ({ text, ts }: { text: string; ts: number }) => (
  <View className="items-end mb-4">
    <View className="max-w-[78%] bg-primary rounded-2xl rounded-br-sm px-4 py-3">
      <Text className="text-foreground text-base leading-5">{text}</Text>
    </View>
    <View className="flex-row items-center mt-1 mr-1 gap-1">
      <Text className="text-[11px] text-subtle-foreground">{fmtTime(ts)}</Text>
      <Ionicons name="checkmark-done" size={12} color={COLOR.primaryLight} />
    </View>
  </View>
);

const Chatbot = () => {
  const { width, height } = useWindowDimensions();
  const { mutate: aiChatApi, isPending } = useAiChatBot();

  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: "welcome",
      role: "bot",
      text: "Hi, I'm Nexora Bot. Ask me anything.",
      ts: Date.now(),
    },
  ]);
  const [userQuery, setUserQuery] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selectedModelId, setSelectedModelId] =
    useState<string>(DEFAULT_MODEL_ID);
  const selectedModel = findModel(selectedModelId);
  const listRef = useRef<FlashListRef<ChatMessage>>(null);

  const historyPayload = useMemo(
    () =>
      messages
        .filter((m) => m.id !== "welcome" && !m.isError)
        .map((m) => ({
          role: m.role === "bot" ? "assistant" : "user",
          content: m.text,
        })),
    [messages],
  );

  const canSend = userQuery.trim().length > 0 && !isPending;

  const handleQuerySend = () => {
    const text = userQuery.trim();
    if (!text || isPending) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      text,
      ts: Date.now(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setUserQuery("");

    aiChatApi(
      {
        provider: selectedModel.apiProvider,
        model: selectedModel.id,
        // Backend expects [{role, content}]; the hook's `string[]` type is a
        // pre-existing loose typing that we intentionally cast through.
        history: historyPayload as unknown as string[],
        message: text,
      },
      {
        onSuccess: (data) => {
          const reply = parseAiResponse(data).trim() || "…";
          setMessages((prev) => [
            ...prev,
            {
              id: `b-${Date.now()}`,
              role: "bot",
              text: reply,
              ts: Date.now(),
            },
          ]);
        },
        onError: () => {
          setMessages((prev) => [
            ...prev,
            {
              id: `err-${Date.now()}`,
              role: "bot",
              text: "Something went wrong. Please try again.",
              ts: Date.now(),
              isError: true,
            },
          ]);
        },
      },
    );
  };

  return (
    <View className="flex-1 bg-surface">
      {/* Ambient liquid-glass background */}
      <View className="absolute inset-0 overflow-hidden">
        <LinearGradient
          colors={[
            COLOR.surfaceDark,
            COLOR.surfaceBase,
            COLOR.surfaceLight,
            COLOR.surfaceDark,
          ]}
          style={{ position: "absolute", width: "100%", height: "100%" }}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />

        <AnimatedOrb
          colors={[COLOR.primary, COLOR.primaryDark]}
          size={260}
          initialX={-60}
          initialY={height * 0.08}
          duration={4200}
        />
        <AnimatedOrb
          colors={[COLOR.primaryLight, COLOR.primary]}
          size={220}
          initialX={width - 120}
          initialY={height * 0.35}
          duration={4800}
        />
        <AnimatedOrb
          colors={[COLOR.primaryDark, COLOR.primary]}
          size={180}
          initialX={width * 0.25}
          initialY={height * 0.7}
          duration={3800}
        />

        <BlurView
          intensity={65}
          tint="dark"
          style={{ position: "absolute", width: "100%", height: "100%" }}
        />
      </View>

      <SafeAreaView className="flex-1" edges={["top"]}>
        {/* Glass header */}
        <BlurView
          intensity={40}
          tint="dark"
          className="overflow-hidden border-b border-border"
        >
          <View className="flex-row items-center bg-surface-overlay/40 px-4 py-3">
            <Pressable className="w-10 h-10 rounded-full items-center justify-center">
              <Ionicons name="menu" size={22} color={COLOR.foreground} />
            </Pressable>
            <View className="flex-1 items-center">
              <Text className="text-foreground text-lg font-semibold">
                Nexora Bot
              </Text>
              <Pressable
                onPress={() => setPickerOpen(true)}
                hitSlop={6}
                className="flex-row items-center mt-1 px-2.5 py-1 rounded-full border border-border bg-surface-elevated/50"
              >
                <View className="w-1.5 h-1.5 rounded-full bg-success mr-1.5" />
                <Text
                  className="text-muted-foreground text-[11px] mr-1"
                  numberOfLines={1}
                >
                  {selectedModel.label}
                </Text>
                <Ionicons
                  name="chevron-down"
                  size={12}
                  color={COLOR.primaryLight}
                />
              </Pressable>
            </View>
            <Pressable
              className="w-10 h-10 rounded-full items-center justify-center"
              onPress={() => setPickerOpen(true)}
            >
              <Ionicons
                name="ellipsis-vertical"
                size={20}
                color={COLOR.foreground}
              />
            </Pressable>
          </View>
        </BlurView>

        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          keyboardVerticalOffset={0}
        >
          <FlashList
            ref={listRef}
            data={messages}
            keyExtractor={(m) => m.id}
            renderItem={({ item }) =>
              item.role === "user" ? (
                <UserBubble text={item.text} ts={item.ts} />
              ) : (
                <BotBubble
                  text={item.text}
                  ts={item.ts}
                  isError={item.isError}
                />
              )
            }
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingTop: 16,
              paddingBottom: 8,
            }}
            showsVerticalScrollIndicator={false}
            ListFooterComponent={isPending ? <ThinkingBubble /> : null}
            onContentSizeChange={() =>
              listRef.current?.scrollToEnd({ animated: true })
            }
          />

          {/* Glass input pill */}
          <View className="px-4 pt-2 pb-3">
            <View className="rounded-full overflow-hidden border border-border">
              <LinearGradient
                colors={["rgba(124,111,247,0.14)", "rgba(155,145,255,0.06)"]}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                }}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
              <BlurView intensity={50} tint="dark">
                <View className="flex-row items-center bg-surface-card/40 px-2 py-1.5 gap-2">
                  <Pressable className="w-9 h-9 rounded-full bg-surface-elevated items-center justify-center">
                    <Ionicons name="add" size={20} color={COLOR.primary} />
                  </Pressable>
                  <TextInput
                    placeholder="Message Nexora Bot..."
                    placeholderTextColor={COLOR.subtleForeground}
                    className="flex-1 text-foreground text-sm py-2"
                    value={userQuery}
                    onChangeText={setUserQuery}
                    onSubmitEditing={handleQuerySend}
                    multiline
                    style={{ maxHeight: 100 }}
                    editable={!isPending}
                  />
                  <Pressable
                    className={`w-9 h-9 rounded-full items-center justify-center ${
                      canSend ? "bg-primary" : "bg-surface-elevated"
                    }`}
                    onPress={handleQuerySend}
                    disabled={!canSend}
                  >
                    <Ionicons
                      name="send"
                      size={16}
                      color={canSend ? COLOR.surfaceDark : COLOR.subtleForeground}
                    />
                  </Pressable>
                </View>
              </BlurView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>

      <ModelPickerModal
        visible={pickerOpen}
        selectedId={selectedModelId}
        onSelect={(m) => setSelectedModelId(m.id)}
        onClose={() => setPickerOpen(false)}
      />
    </View>
  );
};

export default Chatbot;
