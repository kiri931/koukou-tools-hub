import { useEffect, useRef } from "react";
import type { DetailedHTMLProps, HTMLAttributes } from "react";
import "mathlive";

import { cn } from "@/lib/utils";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "math-field": DetailedHTMLProps<
        HTMLAttributes<HTMLElement> & {
          value?: string;
          "read-only"?: boolean;
          "math-virtual-keyboard-policy"?: string;
          placeholder?: string;
        },
        HTMLElement
      >;
    }
  }
}

interface MathLiveInputProps {
  value: string;
  onChange: (latex: string) => void;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}

export default function MathLiveInput({
  value,
  onChange,
  disabled = false,
  className,
  placeholder,
}: MathLiveInputProps) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current as { value?: string } | null;
    if (el && el.value !== value) {
      el.value = value;
    }
  }, [value]);

  return (
    <math-field
      ref={ref}
      value={value}
      placeholder={placeholder}
      read-only={disabled || undefined}
      math-virtual-keyboard-policy="onfocus"
      onInput={(event: Event) => {
        const target = event.target as { value?: string } | null;
        onChange(target?.value ?? "");
      }}
      className={cn(
        "block w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        disabled && "cursor-not-allowed opacity-50",
        className
      )}
    />
  );
}
