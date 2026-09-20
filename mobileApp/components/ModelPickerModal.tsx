import { Modal, Pressable, Text, View } from "react-native";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AI_MODEL_GROUPS, AiModel } from "../lib/aiModels";

// Palette-derived hex values (kept in sync with mobileApp/tailwind.config.js).
const FOREGROUND = "#F5F5F7";
const PRIMARY_LIGHT = "#9B91FF";

type Props = {
  visible: boolean;
  selectedId: string;
  onSelect: (m: AiModel) => void;
  onClose: () => void;
};

const ModelPickerModal = ({ visible, selectedId, onSelect, onClose }: Props) => {
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <Pressable
        onPress={onClose}
        className="flex-1 bg-surface-dark/70 justify-end"
      >
        {/* Inner Pressable swallows taps so the sheet doesn't dismiss when tapped */}
        <Pressable onPress={() => {}}>
          <BlurView
            intensity={60}
            tint="dark"
            className="rounded-t-3xl overflow-hidden border border-border"
          >
            <View
              className="bg-surface-card/50 pt-3 px-4"
              style={{ paddingBottom: Math.max(insets.bottom, 16) + 8 }}
            >
              <View className="self-center w-10 h-1 rounded-full bg-surface-elevated mb-3" />

              <View className="flex-row items-center justify-between mb-4 px-1">
                <Text className="text-foreground text-lg font-semibold">
                  Choose model
                </Text>
                <Pressable onPress={onClose} hitSlop={8}>
                  <Ionicons name="close" size={22} color={FOREGROUND} />
                </Pressable>
              </View>

              {AI_MODEL_GROUPS.map((group) => (
                <View key={group.provider} className="mb-3">
                  <Text className="text-subtle-foreground text-[11px] font-semibold uppercase tracking-wider mb-2 px-1">
                    {group.label}
                  </Text>

                  {group.models.map((m) => {
                    const selected = m.id === selectedId;
                    return (
                      <Pressable
                        key={m.id}
                        onPress={() => {
                          onSelect(m);
                          onClose();
                        }}
                        className={`flex-row items-center rounded-2xl px-3 py-3 mb-1.5 border ${
                          selected
                            ? "bg-primary/20 border-primary/40"
                            : "bg-surface-elevated/50 border-border"
                        }`}
                      >
                        <View className="w-8 h-8 rounded-full items-center justify-center bg-surface-overlay border border-border mr-3">
                          <Ionicons
                            name={
                              group.provider === "openai"
                                ? "sparkles"
                                : "planet"
                            }
                            size={14}
                            color={PRIMARY_LIGHT}
                          />
                        </View>
                        <View className="flex-1">
                          <Text
                            className={`text-base ${
                              selected ? "text-primary" : "text-foreground"
                            }`}
                          >
                            {m.label}
                          </Text>
                          {m.hint ? (
                            <Text className="text-subtle-foreground text-xs mt-0.5">
                              {m.hint}
                            </Text>
                          ) : null}
                        </View>
                        {selected ? (
                          <Ionicons
                            name="checkmark-circle"
                            size={20}
                            color={PRIMARY_LIGHT}
                          />
                        ) : null}
                      </Pressable>
                    );
                  })}
                </View>
              ))}
            </View>
          </BlurView>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

export default ModelPickerModal;
