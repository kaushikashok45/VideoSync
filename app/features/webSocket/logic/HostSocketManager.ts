import HostPeerManager from "~/features/webRTC/logic/HostPeerManager";
import type {
    SocketManager,
    socketParams,
} from "../../../contracts/features/webSocket/socket";
import { peerSetupMeta, peerMeta } from "../../../utils/peerRegistryContract";
import { captureStream } from "../../../utils/videoPlayerUtils";
import BaseSocketManager from "./BaseSocketManager";
import { SignalData } from "simple-peer";
import { SOCKET_EVENTS } from "~/contracts/features/webSocket/constants";

class HostSocketManager extends BaseSocketManager implements SocketManager {
    private peerMap: Map<string, peerMeta>;
    private mediaStream: MediaStream | undefined;

    constructor(socketMeta: socketParams, videoElement: HTMLVideoElement) {
        super(socketMeta, videoElement);
        if (!videoElement)
            throw new Error(
                "Video element is required to initialize HostSocketManager."
            );
        this.peerMap = new Map();
        this.initializeMediaStream();
        this.setupListeners();
    }

    async initializeMediaStream() {
        captureStream(this.videoElement)
            .then((stream) => {
                this.mediaStream = stream;
            })
            .catch((error) => {
                throw new Error("Error capturing media stream: " + error);
            });
    }

    addPeer(peerId: string, peerMetaData: peerMeta): void {
        this.peerMap.set(peerId, peerMetaData);
    }

    handleUserJoined(data: peerSetupMeta): void {
        super.handleUserJoined(data);
        const { userName, peerId } = data;
        const hostPeer = new HostPeerManager(
            this.videoElement,
            this.mediaStream as MediaStream,
            this.socket,
            peerId,
            userName,
            this.addPeer.bind(this)
        );
        const boundSerialize = hostPeer.serialize.bind(hostPeer);
        this.peerMap.set(peerId, { userName, ...boundSerialize() });
    }

    handleUserLeft(data: peerSetupMeta): void {
        super.handleUserLeft(data);
        this.peerMap.delete(data.peerId);
        // TODO: remove peer connection with the user
    }

    handleSignal(data: unknown): void {
        const { peerId, signalData } = data as {
            peerId: string;
            signalData: SignalData;
        };
        if (!peerId || !this.peerMap.has(peerId)) return;
        const { peerInstance } = this.peerMap.get(peerId) as peerMeta;
        peerInstance.signal(signalData);
    }

    terminateMediastream() {
        if (!this.mediaStream) return;
        this.mediaStream.getTracks().forEach((track) => track.stop());
    }

    destroy() {
        this.peerMap.forEach((peerMeta) => {
            const { peerInstance } = peerMeta;
            peerInstance.destroy();
        });
        this.terminateMediastream();
        this.peerMap.clear();
        this.socket.disconnect();
        this.socket.close();
    }

    handleConnectionError(error: Error): void {
        console.error("Socket connection error:", error);
        // Additional error handling logic can be added here
    }

    pausePlaybackForAllPeers(initiator = this.socketMeta.userName): void {
        this.peerMap.forEach((peerMeta) => {
            if (initiator === peerMeta.userName) return;
            const { peerDataChannel } = peerMeta;
            peerDataChannel.sendPauseSignal(initiator);
        });
    }

    resumePlaybackForAllPeers(initiator = this.socketMeta.userName): void {
        this.peerMap.forEach((peerMeta) => {
            if (initiator === peerMeta.userName) return;
            const { peerDataChannel } = peerMeta;
            peerDataChannel.sendResumeSignal(initiator);
        });
    }

    forwardPlaybackForAllPeers(initiator = this.socketMeta.userName): void {
        this.peerMap.forEach((peerMeta) => {
            if (initiator === peerMeta.userName) return;
            const { peerDataChannel } = peerMeta;
            peerDataChannel.sendForwardSignal(initiator);
        });
    }

    rewindPlaybackForAllPeers(initiator = this.socketMeta.userName): void {
        this.peerMap.forEach((peerMeta) => {
            if (initiator === peerMeta.userName) return;
            const { peerDataChannel } = peerMeta;
            peerDataChannel.sendRewindSignal(initiator);
        });
    }

    seekPlaybackForAllPeers(
        initiator = this.socketMeta.userName,
        time: number
    ): void {
        this.peerMap.forEach((peerMeta) => {
            if (initiator === peerMeta.userName) return;
            const { peerDataChannel } = peerMeta;
            peerDataChannel.sendSeekSignal(initiator, time);
        });
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
}

export default HostSocketManager;
