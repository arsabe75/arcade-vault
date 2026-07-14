import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "cyan" | "magenta" | "yellow" | "ghost";
type ButtonSize = "default" | "lg" | "xl";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  pulse?: boolean;
  children: ReactNode;
}

const variantClass: Record<ButtonVariant, string> = {
  cyan: "",
  magenta: "magenta",
  yellow: "yellow",
  ghost: "ghost",
};

const sizeClass: Record<ButtonSize, string> = {
  default: "",
  lg: "lg",
  xl: "xl",
};

export default function Button({
  variant = "cyan",
  size = "default",
  pulse = false,
  className = "",
  children,
  ...rest
}: ButtonProps) {
  const cls = [
    "btn",
    variantClass[variant],
    sizeClass[size],
    pulse ? "pulse" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button className={cls} {...rest}>
      {children}
    </button>
  );
}
