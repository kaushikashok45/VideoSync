import SimplePeer from "simple-peer";
import { Socket } from "socket.io-client";

export default function createHostPeer(mediaStream: MediaStream, socket: Socket):SimplePeer.Instance {
    const peer = new SimplePeer({
        initiator: true,
        trickle: false,
        stream: mediaStream
    });

    peer.on('signal', (data) => {
        if (socket?.connected) {
            console.log('Signaling to socket IO server');
            socket.emit('signal', data);
        }
    });

    peer.on('connect', () => {
        console.log('Connected to new peer');
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