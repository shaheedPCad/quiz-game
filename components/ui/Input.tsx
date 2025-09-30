import clsx from "clsx";
import { TextInput, TextInputProps } from "react-native";

export default function Input({ className, ...props }: TextInputProps & { className?: string }) {
  return (
    <TextInput
      placeholderTextColor="#8b8b8b"
      className={clsx(
        "w-full rounded-xl bg-white/10 px-4 py-3 text-white",
        "border border-white/10",
        className
      )}
      {...props}
    />
  );
}
