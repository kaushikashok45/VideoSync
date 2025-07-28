import { useRef, useEffect } from 'react';
import {  useLocation } from "@remix-run/react";
import SimplePeer,{ SignalData } from 'simple-peer';
import { io } from 'socket.io-client';
import {peerDataChannelObject, peerSignal} from "~/utils/peerSignalContract";
import  { toast } from 'sonner';

import VideoCanvas from './VideoCanvas';
import createHostPeer from "~/utils/createHostPeer";


export default function HostVideoPlayer() {
    const location = useLocation();
    const passedState = location.state as {videoURL: string};
    const videoRef = useRef<HTMLVideoElement | null>(null);
    const peerMap = new Map<string,SimplePeer.Instance>();
    const mediaStreamRef = useRef<MediaStream|null>(null);

    useEffect(() => {
        const SOCKET_SERVER_URL = `${window.location.protocol}//localhost:3001`;
        const socket = io(SOCKET_SERVER_URL);

        socket.on('connect',()=>{
            console.log('Connected to socket IO server');
            socket.emit('join-room','room142');
        });

        socket.on('user-joined',(peerId:string)=>{
            console.log(`${peerId} joined the room.Setting up P2P connection...`);
            toast.success(`${peerId} joined the party`);
            startStreaming(peerId);
        });

        socket.on('signal',(data:peerSignal)=>{
            console.log('Received signal from socket IO server',data);
            if(peerMap.has(data.peerId)) {
                peerMap.get(data.peerId)?.signal(data.signalData);
            }
        });

        socket.on('disconnect',()=>{
            console.log('Disconnected from socket IO server');
        });

        socket.on('connect_error',(err)=>{
            console.error('Error connecting to socket IO server',err.message);
        });

        const startStreaming = (peerId:string)=>{
            if(!socket?.connected){
                console.error('Not connected to socket IO server');
                return;
            }
            console.log(`Streaming starts...`);

            if(videoRef.current) {

                if(mediaStreamRef.current === null){
                    // @ts-ignore
                    mediaStreamRef.current = videoRef.current.captureStream(); //TODO:This works only in Chrome.Develop a polyfill for other unsupported browsers.
                }


                const peer = createHostPeer(mediaStreamRef.current as MediaStream,socket,peerId,videoRef.current.getHTMLElement(),videoRef);
                peerMap.set(peerId,peer);
            }
        }

        const pausePlaybackForAllPeers = ()=>{
            const dataObject:peerDataChannelObject = {
                action:'pause-playback',
                peerId:'Will be worked on',
                data:{}
            };
            const dataString = JSON.stringify(dataObject);
            peerMap.forEach(peer=>peer.send(dataString));
        };

        const resumePlaybackForAllPeers = ()=>{
            const dataObject:peerDataChannelObject = {
                action:'resume-playback',
                peerId:'Will be worked on',
                data:{
                    duration:videoRef.current?.getDuration(),
                    currentTime:videoRef.current?.getCurrentTime()
                }
            };
            const dataString = JSON.stringify(dataObject);
            peerMap.forEach(peer=>peer.send(dataString));
        };

        videoRef.current?.addEventListener('pause',pausePlaybackForAllPeers);
        videoRef.current?.addEventListener('play',resumePlaybackForAllPeers);

        return () => {
            console.log('Disconnecting from socket IO server');
            socket.disconnect();
            console.log('Destroying peers');
            peerMap.forEach(peer=>peer.destroy());
            videoRef.current?.removeEventListener('pause',pausePlaybackForAllPeers);
            videoRef.current?.removeEventListener('play',resumePlaybackForAllPeers);
        }

    },[]);

    return (
        <>
            <VideoCanvas videoURL={passedState.videoURL} ref={videoRef}/>
        </>
    );
}