import {
  Links,
  LinksFunction,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useNavigate,
  useRouteError,
} from "react-router";
import fontsUrl from "./styles/fonts.css?url";
import styles from "./tailwind.css?url";
import { Toaster } from "sonner";
import { APP_NAME } from "./common/contracts/constants";
import favicon from "../public/thesyncpartyfavicon.png";
import { Providers } from "./app/providers.tsx";
import { toAppErrorPayload } from "./shared/api/error-bridge.ts";
import { createErrorStore } from "./shared/api/error-store.ts";
import { ErrorScreen } from "./shared/ui-kit/error-screen.tsx";
import { ErrorSurface } from "./widgets/error-surface/ui/error-surface.tsx";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: fontsUrl },
  { rel: "stylesheet", href: styles },
];

const errorStore = createErrorStore();

export function ErrorBoundary() {
  const error = useRouteError();
  const navigate = useNavigate();
  const payload = toAppErrorPayload(error);
  return <ErrorScreen payload={payload} onHome={() => navigate("/")} />;
}

export function Layout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1"
        />
        <title className={`font-yesteryear`}>{APP_NAME}</title>
        <link rel="icon" href={favicon} />
        <Meta />
        <Links />
      </head>
      <body className="bg-bg text-ink font-sans min-h-screen w-full flex flex-col">
        <Providers>
          <ErrorSurface
            errorStore={errorStore}
            onHome={() => navigate("/")}
          />
          <Toaster position="top-right" richColors closeButton theme="dark" />
          <main id="content-container" className="flex-1 w-full flex">
            {children}
          </main>
          <ScrollRestoration />
          <Scripts />
        </Providers>
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}
