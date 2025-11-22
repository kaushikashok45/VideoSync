import {SignalData} from "simple-peer";

export type peerSignal = {
    peerId: string;
    signalData:SignalData;
};

export type peerVideoMeta = {
    duration: number;
    currentTime: number;
};

export type peerDataChannelObject = {
    action: string;
    peerId: string;
    userName: string;
    data: any;
}

export type videoPlaybackControlMeta = {
    userName: string;
    peerId: string;
    target:HTMLVideoElement;
};