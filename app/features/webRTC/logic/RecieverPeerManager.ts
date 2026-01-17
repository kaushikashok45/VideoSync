import BasePeerManager from "./BasePeerManager";
import { PEER_CONNECTION_EVENTS } from "../contracts/constants";
import { Socket } from "socket.io-client";

class RecieverPeerManager extends BasePeerManager {
    constructor(
        videoElement: HTMLVideoElement,
        otherPeerId: string,
        socket: Socket
    ) {
        super(
            { initiator: false, trickle: false },
            videoElement,
            otherPeerId,
            socket
        );
        this.setupListeners();
    }

    handleStream(stream: MediaStream) {
        const videoTrack = stream.getVideoTracks()[0];
        videoTrack.addEventListener("unmute", () => {
            if (this.videoElement) {
                if ("srcObject" in this.videoElement) {
                    this.videoElement.srcObject = stream;
                } else {
                    // @ts-ignore - needed for unsupported browsers
                    this.videoElement.src = URL.createObjectURL(stream);
                }
            }
        });
    }
    setupListeners() {
        super.setupListeners();
        this.peerInstance.on(
            PEER_CONNECTION_EVENTS.STREAM,
            this.handleStream.bind(this)
        );
        this.peerInstance.on(
            PEER_CONNECTION_EVENTS.CONNECT,
            super.handleConnectionSetup.bind(this)
        );
    }

    destroy() {
        this.peerInstance.destroy();
    }
}

export default RecieverPeerManager;
