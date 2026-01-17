import BaseSocketManager from "./BaseSocketManager";
import { socketParams } from "~/features/webSocket/contracts/socket";
import RecieverPeerManager from "~/features/webRTC/logic/RecieverPeerManager";
import { SOCKET_EVENTS } from "~/features/webSocket/contracts/constants";
import { SignalData } from "simple-peer";
import { WebRTCPeer } from "~/contracts/features/webRTC/peer";

class RecieverSocketManager extends BaseSocketManager {
    private hostPeerId: string | undefined;
    private peerManager: RecieverPeerManager | undefined;

    constructor(socketMeta: socketParams, videoElement: HTMLVideoElement) {
        super(socketMeta, videoElement);
        this.setupListeners();
    }

    handleConnectionError(error: Error): void {
        console.error("Socket connection error:", error);
        // Additional error handling logic can be added here
    }

    handleSignal(data: unknown): void {
        const { peerId, signalData } = data as {
            peerId: string;
            signalData: SignalData;
        };
        this.hostPeerId = peerId;
        console.log("Signal data received:", signalData);
        this.peerManager?.getPeerInstance().signal(signalData);
    }

    handleSocketIdRecieved(data: unknown): void {
        super.handleSocketIdRecieved(data);
        this.peerManager = new RecieverPeerManager(
            this.videoElement,
            this.hostPeerId as string,
            this.socket
        );
    }

    setupListeners(): void {
        super.setupListeners();
        this.socket.on(SOCKET_EVENTS.SIGNAL, this.handleSignal.bind(this));
        this.socket.on(SOCKET_EVENTS.DISCONNECT, this.destroy.bind(this));
        this.socket.on(
            SOCKET_EVENTS.CONNECT_ERROR,
            this.handleConnectionError.bind(this)
        );
    }

    sendPauseSignal() {
        const { peerDataChannel } = this.peerManager?.serialize() as WebRTCPeer;
        peerDataChannel?.sendPauseSignal(this.socketMeta.userName);
    }

    sendResumeSignal() {
        const { peerDataChannel } = this.peerManager?.serialize() as WebRTCPeer;
        peerDataChannel?.sendResumeSignal(this.socketMeta.userName);
    }

    sendForwardSignal() {
        const { peerDataChannel } = this.peerManager?.serialize() as WebRTCPeer;
        peerDataChannel?.sendForwardSignal(this.socketMeta.userName);
    }

    sendRewindSignal() {
        const { peerDataChannel } = this.peerManager?.serialize() as WebRTCPeer;
        peerDataChannel?.sendRewindSignal(this.socketMeta.userName);
    }

    sendManualSeekSignal(time: number) {
        const { peerDataChannel } = this.peerManager?.serialize() as WebRTCPeer;
        peerDataChannel?.sendSeekSignal(this.socketMeta.userName, time);
    }

    destroy(): void {
        this.peerManager?.destroy();
        this.socket.disconnect();
        this.socket.close();
    }
}

export default RecieverSocketManager;
