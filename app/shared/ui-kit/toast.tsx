import { Toaster } from "sonner";
import type { ComponentProps } from "react";

export type ToastProps = ComponentProps<typeof Toaster>;

export function Toast(props: ToastProps) {
  return (
    <Toaster
      theme="dark"
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
