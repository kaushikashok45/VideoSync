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
    data: any;
}