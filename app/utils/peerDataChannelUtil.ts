import SimplePeer from "simple-peer";

export default class PeerDataChannelUtil {
  private videoElement: HTMLVideoElement;
  private peer: SimplePeer.Instance;

  constructor(videoElement: HTMLVideoElement, peer: SimplePeer.Instance) {
    this.videoElement = videoElement;
    this.peer = peer;
  }

  sendVideoDuration() {
    const videoDurationMeta = JSON.stringify({
      type: "video-duration",
      duration: this.videoElement?.duration,
    });
    this.peer?.send(videoDurationMeta);
  }

  sendVideoCurrentTime() {
    const videoCurrentTimeMeta = JSON.stringify({
      type: "video-current-time",
      currentTime: this.videoElement?.currentTime,
    });
    this.peer?.send(videoCurrentTimeMeta);
  }

  sendPauseSignal(initiator: string) {
    const userName = initiator ? initiator : "Unknown user";
    const pauseSignalMeta = JSON.stringify({
      type: "pause-playback",
      userName,
    });
    this.peer?.send(pauseSignalMeta);
  }

  sendResumeSignal(initiator: string) {
    const userName = initiator ? initiator : "Unknown user";
    const resumeSignalMeta = JSON.stringify({
      type: "resume-playback",
      userName,
    });
    this.peer?.send(resumeSignalMeta);
  }
}
