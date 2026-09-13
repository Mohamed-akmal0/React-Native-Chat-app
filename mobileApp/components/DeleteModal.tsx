import { useEffect, useState } from "react";
import { Modal, Pressable, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface DeleteModalProps {
  visible: boolean;
  count: number;
  participantName: string;
  onCancel: () => void;
  onDelete: (deleteForEveryone: boolean) => void;
}

const DeleteModal = ({
  visible,
  count,
  participantName,
  onCancel,
  onDelete,
}: DeleteModalProps) => {
  const [deleteForEveryone, setDeleteForEveryone] = useState(false);

  useEffect(() => {
    if (visible) setDeleteForEveryone(false);
  }, [visible]);

  const messageLabel = count === 1 ? "message" : "messages";

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onCancel}
    >
      <View className="flex-1 items-center justify-center px-6 bg-surface-dark/70">
        <Pressable className="absolute inset-0" onPress={onCancel} />
        <View className="w-full rounded-3xl bg-surface-elevated px-6 pt-6 pb-4">
          <Text className="text-foreground text-xl font-semibold">
            Delete {count} {messageLabel}
          </Text>
          <Text className="text-foreground text-base mt-3 leading-6">
            Are you sure you want to delete{" "}
            {count === 1 ? "this message" : "these messages"}?
          </Text>

          <Pressable
            className="flex-row items-center mt-5 active:opacity-70"
            onPress={() => setDeleteForEveryone((value) => !value)}
          >
            <View
              className={`w-5 h-5 rounded-sm border items-center justify-center ${
                deleteForEveryone
                  ? "bg-info border-info"
                  : "border-muted-foreground"
              }`}
            >
              {deleteForEveryone ? (
                <Ionicons name="checkmark" size={14} color="#F5F5F7" />
              ) : null}
            </View>
            <Text className="text-foreground text-base ml-3">
              Also delete for {participantName}
            </Text>
          </Pressable>

          <View className="flex-row justify-end items-center gap-8 mt-6 py-2">
            <Pressable className="active:opacity-70" onPress={onCancel}>
              <Text className="text-info text-base font-semibold">Cancel</Text>
            </Pressable>
            <Pressable
              className="active:opacity-70"
              onPress={() => onDelete(deleteForEveryone)}
            >
              <Text className="text-danger text-base font-semibold">
                Delete
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default DeleteModal;
