import { useRef, useEffect } from 'react';
import {  useLocation } from "@remix-run/react";
import SimplePeer from 'simple-peer';
import { io } from 'socket.io-client';

import VideoCanvas from './VideoCanvas';
import createHostPeer from "~/utils/createHostPeer";

// const SOCKET_SERVER_URL = "http://localhost:3001";

export default function HostVideoPlayer() {
    const location = useLocation();
    const passedState = location.state as {videoURL: string};
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const peerRef = useRef<SimplePeer.Instance | null>(null);
    const mediaStreamRef = useRef<MediaStream|null>(null);

    useEffect(() => {
        const SOCKET_SERVER_URL = `${window.location.protocol}//localhost:3001`;
        const socket = io(SOCKET_SERVER_URL);

        socket.on('connect',()=>{
            console.log('Connected to socket IO server');
            socket.emit('join-room','room142');
        });

        socket.on('user-joined',(msg)=>{
            console.log(`${msg}.Setting up P2P connection...`);
            startStreaming();
        });

        socket.on('signal',(data)=>{
            console.log('Received signal from socket IO server',data);
            if(peerRef.current){
                peerRef.current.signal(data);
            }
        });

        socket.on('disconnect',()=>{
            console.log('Disconnected from socket IO server');
        });

        socket.on('connect_error',(err)=>{
            console.error('Error connecting to socket IO server',err.message);
        });

        const startStreaming = ()=>{
            if(!socket?.connected){
                console.error('Not connected to socket IO server');
                return;
            }
            console.log(`Streaming starts...`);

            if(videoRef.current) {
                // @ts-ignore
                if(mediaStreamRef.current === null){
                    mediaStreamRef.current = videoRef.current.captureStream();
                }


                const peer = createHostPeer(mediaStreamRef.current as MediaStream,socket)
                peerRef.current = peer;
            }
        }

        return () => {
            console.log('Disconnecting from socket IO server');
            socket.disconnect();
            peerRef.current?.destroy();
        }

    },[]);

    return (
        <>
            <VideoCanvas videoURL={passedState.videoURL} ref={videoRef}/>
        </>
    );
}