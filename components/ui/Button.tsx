import clsx from "clsx";
import { Pressable, PressableProps, Text } from "react-native";

type Variant = "primary" | "ghost";
type Size = "md" | "lg";

type Props = PressableProps & {
  children: React.ReactNode;
  variant?: Variant;
  size?: Size;
  className?: string;
};

export default function Button({
  children,
  variant = "primary",
  size = "md",
  className,
  ...props
}: Props) {
  const base =
    "rounded-xl items-center justify-center active:opacity-90 disabled:opacity-50";
  const sizes = {
    md: "px-4 py-3",
    lg: "px-5 py-4",
  }[size];
  const variants = {
    primary: "bg-violet-500",
    ghost: "bg-white/10",
  }[variant];

  return (
    <Pressable {...props} className={clsx(base, sizes, variants, className)}>
      <Text className="text-white font-semibold">{children}</Text>
    </Pressable>
  );
}
