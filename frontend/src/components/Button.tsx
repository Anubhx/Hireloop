import { ButtonHTMLAttributes, forwardRef } from "react";

type ButtonVariant = "primary" | "ghost" | "success" | "danger";
type ButtonSize = "default" | "sm";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: "bg-accent text-white hover:bg-accent-hover",
  ghost: "bg-transparent text-text-secondary border border-border-color hover:bg-surface-3",
  success: "bg-success-light text-success hover:bg-success/15",
  danger: "bg-danger-light text-danger hover:bg-danger/15",
};

const sizeStyles: Record<ButtonSize, string> = {
  default: "px-3.5 py-[7px] text-xs",
  sm: "px-2.5 py-1 text-[11px]",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "default", className = "", children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`font-body font-medium rounded-md border-none cursor-pointer inline-flex items-center gap-1.5 transition-all duration-150 ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
