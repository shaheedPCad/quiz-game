import clsx from "clsx";
import { View, ViewProps } from "react-native";

export default function Screen({ className, ...props }: ViewProps & { className?: string }) {
  return <View {...props} className={clsx("flex-1 bg-black px-6", className)} />;
}
