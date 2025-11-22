import { toast} from "sonner";
import ToastMessageView from "~/toastMessages/ToastMessageView";
import { PlayIcon, PauseIcon } from "@heroicons/react/24/solid";

export function joinedPartySuccessMessage(userName:string) {
    const message = 'joined the party';
    const icon = '🙌';
    toast(<ToastMessageView message={message} userName={userName} icon={icon}></ToastMessageView>);
}

export function pausedPlaybackMessage(userName:string) {
    const message = 'paused playback';
    const icon = '&#9208;';
    toast(<ToastMessageView message={message} userName={userName} icon={icon}></ToastMessageView>);
}

export function resumedPlaybackMessage(userName:string) {
    const message = 'resumed playback';
    const icon = '&#9654;';
    toast(<ToastMessageView message={message} userName={userName} icon={icon}></ToastMessageView>);
}