import BasePeerManager from "./BasePeerManager";
import { PEER_CONNECTION_EVENTS } from "../../../contracts/features/webRTC/constants";
import { Socket } from "socket.io-client";
import { SignalData } from "simple-peer";

class HostPeerManager extends BasePeerManager {
    private syncInterval: number;
    private syncIntervalId: NodeJS.Timeout | undefined;
    private mediaStream: MediaStream | undefined;
    private userName: string;
    private addPeer: (peerId: string, peerMetaData: any) => void;

    constructor(
        videoElement: HTMLVideoElement,
        mediaStream: MediaStream,
        socket: Socket,
        recieverId: string,
        userName: string,
        addPeer: (peerId: string, peerMetaData: any) => void,
        syncInterval = 1000
    ) {
        super(
            { initiator: true, trickle: false },
            videoElement,
            recieverId,
            socket
        );
        this.syncInterval = syncInterval;
        this.mediaStream = mediaStream;
        this.userName = userName;
        this.addPeer = addPeer;
        this.setupListeners();
    }

    startSync() {
        if (
            this.videoElement.paused ||
            !this.peerDataChannel ||
            !this.mediaStream
        )
            return;
        this.peerInstance.addStream(this.mediaStream);
        this.addPeer(this.otherPeerId, {
            userName: this.userName,
            ...this.serialize(),
        });
        this.peerDataChannel.sendVideoDuration();
        this.syncIntervalId = setInterval(() => {
            this.peerDataChannel && this.peerDataChannel.sendVideoCurrentTime();
        }, this.syncInterval);
    }

    stopSync(): void {
        if (this.syncIntervalId) {
            clearInterval(this.syncIntervalId);
        }
    }

    handleConnectionSetup() {
        super.handleConnectionSetup();
        this.startSync();
    }

    setupListeners(): void {
        super.setupListeners();
        this.peerInstance.on(
            PEER_CONNECTION_EVENTS.CONNECT,
            this.handleConnectionSetup.bind(this)
        );
    }

    destroy(): void {
        this.stopSync();
        this.peerInstance.destroy();
    }
}
export default HostPeerManager;
