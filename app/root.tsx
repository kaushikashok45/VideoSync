import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";
import type { LinksFunction } from "@remix-run/node";
import fontsUrl from "./styles/fonts.css?url";
import styles from "./tailwind.css?url";
import Header from "./routes/Header";
import { Toaster } from "sonner";
import UserNameContextProvider from "~/routes/UserNameContextProvider";
import RoomIdContextProvider from "~/routes/RoomIdContextProvider";
import { APP_NAME } from "~/Constants";
import Footer from "~/routes/Footer";
import favicon from "../public/thesyncpartyfavicon.png";

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: fontsUrl },
  { rel: "stylesheet", href: styles },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title className={`font-yesteryear`}>{APP_NAME}</title>
        <link rel="icon" href={favicon} />
        <Meta />
        <Links />
      </head>
      <body
        className={`font-overpass h-dvh w-dvh flex flex-col dark:bg-gradient-to-b dark:from-gray-800 dark:via-gray-900 dark:to-black`}
      >
        <UserNameContextProvider>
          <RoomIdContextProvider>
            <Toaster
              position="top-right"
              richColors
              closeButton
              theme="system"
            ></Toaster>
            <Header />
            <div id="content-container" className={`h-full w-full`}>
              {children}
            </div>
            <Footer></Footer>
            <ScrollRestoration />
            <Scripts />
          </RoomIdContextProvider>
        </UserNameContextProvider>
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}
