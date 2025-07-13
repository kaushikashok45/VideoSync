import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";
import type { LinksFunction } from "@remix-run/node";
import fontsUrl from './styles/fonts.css?url';
import styles from "./tailwind.css?url";
import Header from "./routes/Header";


export const links: LinksFunction = () => [
  { rel: "stylesheet",
    href: fontsUrl
  },
  { rel: "stylesheet",
    href: styles
  }
];

export function Layout({ children }: { children: React.ReactNode }) {

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title className={`font-yesteryear`}>VideoSync</title>
        <Meta />
        <Links />
      </head>
      <body className={`font-overpass`}>
        <Header />
        <div id='content-container' className={`flex items-center justify-center h-screen w-screen`}>
          {children}
        </div>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}
