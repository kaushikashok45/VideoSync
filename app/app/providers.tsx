import type { ReactNode } from "react";
import SessionContextProvider from "~/context/Session/components/SessionContextProvider";
import { ThemeProvider } from "./theme-provider.tsx";
import { SocketProvider } from "../shared/api/socket-bridge.tsx";

export function Providers({ children }: { children?: ReactNode }) {
  return (
    <ThemeProvider>
      <SessionContextProvider>
        <SocketProvider>{children}</SocketProvider>
      </SessionContextProvider>
    </ThemeProvider>
  );
}
