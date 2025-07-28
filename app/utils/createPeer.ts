import SimplePeer from "simple-peer";
import { Socket } from "socket.io-client";

export default function createHostPeer(mediaStream: MediaStream, socket: Socket,peerId:string,videoElement:HTMLVideoElement):SimplePeer.Instance {

    const peer = new SimplePeer({
        initiator: true,
        trickle: false,
        stream: mediaStream
    });

    peer.on('signal', (data) => {
        // peer.emit('signal', data);
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
    });

    peer.on('data',(data)=>{
        const stringData = data.toString('utf-8');
        console.log('Peer data event fired.Data: ', stringData);
        if(stringData === 'pause-playback'){
            videoElement.pause();
        }
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