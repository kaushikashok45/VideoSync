import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration, useLocation,
} from "@remix-run/react";
import type { LinksFunction } from "@remix-run/node";
import fontsUrl from './styles/fonts.css?url';
import styles from "./tailwind.css?url";
import VideoCanvas from "./routes/VideoCanvas";
import UploadFile from "./routes/UploadFile";
import Header from "./routes/Header";
import {useEffect, useState} from "react";
import SetupScreen from "~/routes/SetupScreen";

export const links: LinksFunction = () => [
  { rel: "stylesheet",
    href: fontsUrl
  },
  { rel: "stylesheet",
    href: styles
  }
];

export function Layout({ children }: { children: React.ReactNode }) {

  const [isVideoUploaded, setIsVideoUploaded] = useState(false);
  const [videoURL, setVideoURL] = useState("");
  const [isMounted, setIsMounted] = useState(false);
  const handleVideoUpload = (file:File) => {
    const url = URL.createObjectURL(file);
    console.log(url);
    setVideoURL(url);
    setIsVideoUploaded(true);
  }

  useEffect(() => {
    setIsMounted(true);
  },[])
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
          {/*<SetupScreen></SetupScreen>*/}
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
