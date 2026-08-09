import { useContext, useRef, useState } from "react";
import SessionContext from "../../../context/Session/logic/SessionContext";
import Popover from "../../../common/components/Popover";
import ButtonComponent from "./VideoPlayerButtonComponent";
import { Clipboard, ClipboardCheck, Share2 } from "lucide-react";

function ShareIcon() {
  return (
    <>
      <ButtonComponent>
        <Share2 className="size-6" />
      </ButtonComponent>
    </>
  );
}

function getLink(roomId: string): string {
  if (typeof window !== "undefined") {
    return `${globalThis.location.origin}?roomId=${roomId}`;
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
      <button
        type="button"
        className="p-1 h-full"
        onClick={handleCopyToClipBoard}
      >
        {isCopiedToClipBoard
          ? <ClipboardCheck className="h-7 w-5 cursor-pointer text-white" />
          : <Clipboard className="h-7 w-5 cursor-pointer text-white" />}
      </button>
    </div>
  );
}

export default function ShareLink() {
  const shareLinkRef = useRef<HTMLDivElement>(null);

  return (
    <div className="relative" ref={shareLinkRef}>
      <ShareIcon></ShareIcon>
      <Popover
        triggerElementRef={shareLinkRef}
        classList="-right-[14em] -translate-x-1/2 mb-[0.7em]"
      >
        <span>
          You can use the below link<br></br>{" "}
          to allow your friends to join the party:
        </span>
        <Link></Link>
      </Popover>
    </div>
  );
}
