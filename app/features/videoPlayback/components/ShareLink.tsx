import { useContext, useRef, useState } from "react";
import SessionContext from "../../../context/Session/logic/SessionContext";
import {
    ClipboardIcon,
    ClipboardDocumentCheckIcon,
} from "@heroicons/react/24/solid";
import Popover from "../../../common/components/Popover";
import ButtonComponent from "./VideoPlayerButtonComponent";

function ShareIcon() {
    return (
        <>
            <ButtonComponent>
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={1.5}
                    stroke="currentColor"
                    className="size-6"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z"
                    />
                </svg>
            </ButtonComponent>
        </>
    );
}

function getLink(roomId: string): string {
    if (typeof window !== "undefined") {
        return `${window.location.origin}?roomId=${roomId}`;
    }
    return "";
}

function Link() {
    const { roomId } = useContext(SessionContext);
    const shareLink = getLink(roomId);
    const [isCopiedToClipBoard, setIsCopiedToClipBoard] = useState(false);

    async function handleCopyToClipBoard() {
        try {
            await navigator.clipboard.writeText(shareLink);
            console.log("Text successfully copied to clipboard");
            setIsCopiedToClipBoard(true);

            // Reset back to copy icon after 2 seconds
            setTimeout(() => {
                setIsCopiedToClipBoard(false);
            }, 2000);
        } catch (err) {
            console.error("Failed to copy text: ", err);
        }
    }

    return (
        <div className="flex w-full items-center justify-center">
            <p className="bg-white dark:bg-black p-1 max-w-72 text-nowrap text-ellipsis overflow-hidden">
                {shareLink}
            </p>
            <button className="p-1 h-full" onClick={handleCopyToClipBoard}>
                {isCopiedToClipBoard ? (
                    <ClipboardDocumentCheckIcon className="h-7 w-5 text-white cursor-pointer"></ClipboardDocumentCheckIcon>
                ) : (
                    <ClipboardIcon className="h-7 w-5 text-white cursor-pointer"></ClipboardIcon>
                )}
            </button>
        </div>
    );
}

export default function ShareLink() {
    const shareLinkRef: React.RefObject<HTMLDivElement> = useRef(null);

    return (
        <div className="relative" ref={shareLinkRef}>
            <ShareIcon></ShareIcon>
            <Popover
                triggerElementRef={shareLinkRef}
                classList="-right-[14em] -translate-x-1/2 mb-[0.7em]"
            >
                <span>
                    You can use the below link<br></br> to allow your friends to
                    join the party:
                </span>
                <Link></Link>
            </Popover>
        </div>
    );
}
