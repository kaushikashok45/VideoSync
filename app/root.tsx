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
                <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1"
                />
                <title className={`font-yesteryear`}>{APP_NAME}</title>
                <link rel="icon" href={favicon} />
                <Meta />
                <Links />
            </head>
            <body
                className="
    font-overpass
    min-h-screen
    w-full
    flex flex-col
    bg-[linear-gradient(180deg,#fff6f5_0%,#ffffff_100%)]
    dark:bg-[radial-gradient(circle_at_top,#131821_0%,#0d1117_100%)]
  "
            >
                <UserNameContextProvider>
                    <RoomIdContextProvider>
                        <Toaster
                            position="top-right"
                            richColors
                            closeButton
                            theme="system"
                        />
                        <Header />
                        <main
                            id="content-container"
                            className="flex-1 w-full flex"
                        >
                            {children}
                        </main>
                        <Footer />
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
