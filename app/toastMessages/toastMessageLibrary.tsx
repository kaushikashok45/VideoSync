import { toast } from "sonner";
import ToastMessageView from "~/toastMessages/ToastMessageView";
import { VIDEO_CHANGE_DURATION } from "~/Constants";

export function joinedPartySuccessMessage(userName: string) {
  const message = "joined the party";
  const icon = "🙌";
  toast(
    <ToastMessageView
      message={message}
      userName={userName}
      icon={icon}
    ></ToastMessageView>
  );
}

export function pausedPlaybackMessage(userName: string) {
  const message = "paused playback";
  const icon = "⏸";
  toast(
    <ToastMessageView
      message={message}
      userName={userName}
      icon={icon}
    ></ToastMessageView>
  );
}

export function resumedPlaybackMessage(userName: string) {
  const message = "resumed playback";
  const icon = "▶";
  toast(
    <ToastMessageView
      message={message}
      userName={userName}
      icon={icon}
    ></ToastMessageView>
  );
}

export function forwardedPlaybackMessage(userName: string) {
  const message = "forwarded playback";
  const icon = `+${VIDEO_CHANGE_DURATION}s`;
  toast(
    <ToastMessageView
      message={message}
      userName={userName}
      icon={icon}
    ></ToastMessageView>
  );
}

export function rewindedPlaybackMessage(userName: string) {
  const message = "rewinded playback";
  const icon = `-${VIDEO_CHANGE_DURATION}s`;
  toast(
    <ToastMessageView
      message={message}
      userName={userName}
      icon={icon}
    ></ToastMessageView>
  );
}
