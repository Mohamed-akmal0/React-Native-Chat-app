import { ActivityIndicator } from "react-native";
import React from "react";

const Loader = ({
  size,
  color,
}: {
  size: "small" | "large";
  color: string;
}) => {
  return <ActivityIndicator size={size} color={color} />;
};

export default Loader;
