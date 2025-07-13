import { useRef, useState, useEffect } from 'react';
import {  useLocation } from "@remix-run/react";
import SimplePeer from 'simple-peer';
import { io, Socket } from 'socket.io-client';

import VideoCanvas from './VideoCanvas';

// const SOCKET_SERVER_URL = "http://localhost:3001";

export default function HostVideoPlayer() {
    const location = useLocation();
    const passedState = location.state as {videoURL: string};
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const [socket, setSocket] = useState<Socket|null>(null);
    const peerRef = useRef<SimplePeer.Instance | null>(null);

    useEffect(() => {
        const SOCKET_SERVER_URL = `${window.location.protocol}//localhost:3001`;
        const newSocket = io(SOCKET_SERVER_URL);
        setSocket(newSocket);

        newSocket.on('connect',()=>{
            console.log('Connected to socket IO server');
            newSocket.emit('join-room','room142');
        });

        newSocket.on('user-joined',(msg)=>{
            console.log(`${msg}.Setting up P2P connection...`);
            startStreaming();
        });

        newSocket.on('signal',(data)=>{
            console.log('Received signal from socket IO server',data);
            if(peerRef.current){
                peerRef.current.signal(data);
            }
        });

        newSocket.on('disconnect',()=>{
            console.log('Disconnected from socket IO server');
        });

        newSocket.on('connect_error',(err)=>{
            console.error('Error connecting to socket IO server',err.message);
        });

        const startStreaming = ()=>{
            if(!newSocket?.connected){
                console.error('Not connected to socket IO server');
                return;
            }
            console.log(`Streaming starts...`);

            let mediaStream:MediaStream;
            if(videoRef.current) {
                // @ts-ignore
                mediaStream = videoRef.current.captureStream();


                console.log('Running on:', typeof window === 'undefined' ? 'Server' : 'Client');
                const peer = new SimplePeer({
                    initiator: true,
                    trickle: false,
                    stream: mediaStream
                });
                peerRef.current = peer;

                peer.on('signal', (data) => {
                    if (newSocket?.connected) {
                        console.log('Signaling to socket IO server');
                        newSocket.emit('signal', data);
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
            }
        }

        // const endStreaming = ()=>{
        //     if(peerRef.current){
        //         peerRef.current.destroy();
        //         peerRef.current = null;
        //     }
        //     if (videoRef.current && videoRef.current.srcObject) {
        //         (videoRef.current.srcObject as MediaStream).getTracks().forEach(track => track.stop());
        //         videoRef.current.srcObject = null;
        //     }
        // };

        return () => {
            console.log('Disconnecting from socket IO server');
            newSocket.disconnect();
        }

    },[]);


    videoRef.current?.addEventListener('play',()=>{
        if(socket && socket.connected){
            socket.emit('video event','Video streaming started');
        }
    });


    return (
        <>
            <VideoCanvas videoURL={passedState.videoURL} ref={videoRef}/>
        </>
    );
}