import SimplePeer from "simple-peer";
import { Socket } from "socket.io-client";
import {peerDataChannelObject, peerVideoMeta, videoPlaybackControlMeta} from "~/utils/peerSignalContract";
import {deHydrateJSONString} from "~/utils/jsonUtils";
import {MutableRefObject} from "react";
export default function createHostPeer(mediaStream: MediaStream, socket: Socket,peerId:string,videoRef:MutableRefObject<any>,hostUserName:string,hostPeerId:string):SimplePeer.Instance {

    const peer = new SimplePeer({
        initiator: true,
        trickle: false,
        stream: mediaStream
    });
    const videoElement = videoRef.current.getHTMLElement();
    peer.on('signal', (data) => {
        const signalData = {
            signalData: data,
            to:peerId
        };
        if (socket?.connected) {
            console.log('Signaling to socket IO server',signalData);
            socket.emit('signal', signalData);
        }
    });

    peer.on('connect', () => {
        console.log('Connected to new peer');
        const videoMeta:peerVideoMeta = {
            duration: videoElement.duration,
            currentTime: videoElement.currentTime,
        };
        const dataObject:peerDataChannelObject = {
            action: 'set-video-meta',
            peerId: hostPeerId,
            userName:hostUserName,
            data: videoMeta
        };
        setTimeout(()=>{
            peer.send(JSON.stringify(dataObject))
        },1000);
    });

    peer.on('data',(data)=>{
        const stringData = data.toString('utf-8');
        const dataObject = deHydrateJSONString(stringData) as peerDataChannelObject;
        if(Object.keys(dataObject).length === 0) return;
        let eventName = '';
        let controlEventName = '';
        const payload:videoPlaybackControlMeta = {
            userName: dataObject.userName,
            peerId: dataObject.peerId,
            target:videoElement
        };
        console.log('Peer data event fired.Data: ', stringData);
        if(!videoElement.paused && dataObject.action === 'pause-playback'){
            eventName = 'pause-video';
            controlEventName = 'pause-video-for-all-peers';
        }
        else if(videoElement.paused && dataObject.action === 'resume-playback'){
            eventName = 'play-video';
            controlEventName = 'play-video-for-all-peers';
        }
        // @ts-ignore
        videoRef.current.triggerEvent(eventName,payload);
        videoRef.current.triggerEvent(controlEventName,payload);
    });

    peer.on('close', () => {
        console.log('Peer-to-peer connection closed.');
        mediaStream.getTracks().forEach((track) => track.stop());
    });

    peer.on('error', (err) => {
        console.error('Peer-to-peer connection error : ', err);
        mediaStream.getTracks().forEach((track) => track.stop());
    });

    return peer;
}