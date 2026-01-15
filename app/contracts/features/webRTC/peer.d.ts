import { SignalData } from "simple-peer";
import PeerDataChannelUtil from "../../../features/webRTC/logic/peerDataChannelUtil";

declare namespace peerContract {
    enum DATA_CHANNEL_MESSAGE_TYPE {
        PAUSE = {
            type: "pause-playback",
            userName: string,
        },
        RESUME = {
            type: "resume-playback",
            userName: string,
        },
        SEEK = "SEEK",
        CURRENT_TIME = {
            type: "video-current-time",
            currentTime: number,
        },
        DURATION = {
            type: "video-duration",
            duration: number,
        },
    }

    type WebRTCPeer = {
        peerInstance: SimplePeer.Instance;
        peerDataChannel: PeerDataChannelUtil;
    };

    interface PeerManager {
        setupListeners: () => void;
        handleConnectionSetup: () => void;
        handleData: (channelData: string) => void;
        handleSignal: (data: SignalData) => void;
        destroy: () => void;
        serialize: () => WebRTCPeer;
        getPeerInstance: () => SimplePeer.Instance;
    }

    type peerConfig = {
        initiator: boolean;
        trickle?: boolean;
    };
}

export = peerContract;
