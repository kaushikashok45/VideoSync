import type {
    PeerManager,
    WebRTCPeer,
    peerConfig,
} from "../../../contracts/features/webRTC/peer";
import { PEER_CONNECTION_EVENTS } from "../contracts/constants";
import SimplePeer from "simple-peer";
import PeerDataChannelUtil from "./peerDataChannelUtil";
import { Socket } from "socket.io-client";

abstract class BasePeerManager implements PeerManager {
    protected peerInstance: SimplePeer.Instance;
    protected peerDataChannel: PeerDataChannelUtil | undefined;
    protected videoElement: HTMLVideoElement;
    protected otherPeerId: string;
    protected socket: Socket;

    constructor(
        config: peerConfig,
        videoElement: HTMLVideoElement,
        otherPeerId: string,
        socket: Socket
    ) {
        this.peerInstance = new SimplePeer(config);
        this.videoElement = videoElement;
        this.otherPeerId = otherPeerId;
        this.socket = socket;
    }

    handleData(channelData: string): void {
        const data = channelData ? JSON.parse(channelData) : null;
        const { type, ...payload } = data;
        if (!data || !type) return;
        const customEvent = new CustomEvent(type, { detail: payload });
        this.videoElement.dispatchEvent(customEvent);
    }

    handleSignal(data: SimplePeer.SignalData): void {
        this.socket.emit("signal", {
            signalData: data,
            to: this.otherPeerId,
        });
    }

    handleConnectionSetup(): void {
        this.peerDataChannel = new PeerDataChannelUtil(
            this.videoElement,
            this.peerInstance
        );
    }

    setupListeners(): void {
        this.peerInstance.on(
            PEER_CONNECTION_EVENTS.DATA,
            this.handleData.bind(this)
        );
        this.peerInstance.on(
            PEER_CONNECTION_EVENTS.SIGNAL,
            this.handleSignal.bind(this)
        );
    }

    serialize(): WebRTCPeer {
        return {
            peerInstance: this.peerInstance,
            peerDataChannel: this.peerDataChannel as PeerDataChannelUtil,
        };
    }

    getPeerInstance(): SimplePeer.Instance {
        return this.peerInstance;
    }

    abstract destroy(): void;
}

export default BasePeerManager;
