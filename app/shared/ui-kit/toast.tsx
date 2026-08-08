import { Toaster } from "sonner";
import type { ComponentProps } from "react";

export type ToastProps =
  & Omit<
    ComponentProps<typeof Toaster>,
    "theme"
  >
  & {
    theme?: "dark" | "light";
  };

export function Toast({ theme = "dark", ...props }: ToastProps) {
  return (
    <Toaster
      theme={theme}
      position="top-right"
      richColors
      closeButton
      toastOptions={{
        style: {
          background: "#1c222b",
          border: "1px solid rgba(230, 233, 238, 0.18)",
          color: "#e6e9ee",
          fontFamily: "Overpass, ui-monospace, monospace",
        },
      }}
      {...props}
    />
  );
}
