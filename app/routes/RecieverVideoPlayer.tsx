import { useRef, useState, useEffect } from 'react';
import  SimplePeer from 'simple-peer';
import { io, Socket } from 'socket.io-client';

import VideoCanvas from './VideoCanvas';
import { peerSignal } from "~/utils/peerSignalContract";

export default function RecieverVideoPlayer() {

    const videoRef = useRef<HTMLVideoElement | null>(null);
    const [socket, setSocket] = useState<Socket|null>(null);
    const peerRef = useRef<SimplePeer.Instance | null>(null);
    const hostPeerId = useRef<string>('');



    useEffect(() => {
        const SOCKET_SERVER_URL = `${window.location.protocol}//localhost:3001`;
        const newSocket = io(SOCKET_SERVER_URL);
        setSocket(newSocket);

        newSocket.on('connect',()=>{
            console.log('Connected to socket IO server');
            newSocket.emit('join-room','room142');
            startReceivingStream();
        });

        newSocket.on('disconnect',()=>{
            console.log('Disconnected from socket IO server');
        });

        newSocket.on('signal',(data:peerSignal)=>{
            console.log('Received signal from socket IO server',data);
            hostPeerId.current = data.peerId;
            if(peerRef.current){
                peerRef.current.signal(data.signalData);
            }
        });

        newSocket.on('video event',(msg:string)=> {
            console.log('video event message received : ', msg);

        });

        newSocket.on('connect_error',(err)=>{
            console.error('Error connecting to socket IO server',err.message);
        });

        const startReceivingStream = () =>{
            const peer = new SimplePeer({
                initiator:false,
                trickle:false
            });
            peerRef.current = peer;

            peer.on('signal',(data)=>{
                const signalData = {
                    signalData: data,
                    to:hostPeerId.current
                };
                if(newSocket?.connected){
                    console.log('Signaling to socket IO server');
                    newSocket.emit('signal', signalData);
                }
            });

            peer.on('connect',()=>{
                console.log(new Date().toISOString(),' Connected to new peer');
            });

            peer.on('stream',(stream)=>{
                console.log(new Date().toISOString(),' Received remote stream from host',stream);
                console.log('Video tracks:', stream.getVideoTracks());
                console.log('Audio tracks:', stream.getAudioTracks());
                const videoTrack = stream.getVideoTracks()[0];

                videoTrack.addEventListener('unmute', () => {
                    console.log('Video track unmuted, media is now flowing');
                    console.log('Video tracks:', stream.getVideoTracks());
                    console.log('Audio tracks:', stream.getAudioTracks());
                    if(videoRef.current){
                        console.log('Setting remote stream to video player');
                        videoRef.current.srcObject = stream;
                    }
                    // Now safe to display video
                });

            });

            peer.on('close',()=>{
                console.log('Peer-to-peer connection closed.');
            });

            peer.on('error',(err)=>{
                console.error('Peer-to-peer connection error : ',err);
            });

            peerRef.current.on('data',(data)=>{
                const stringData = data.toString('utf-8');
                console.log('Peer data event fired.Data: ', stringData);
                if(!videoRef.current?.paused && stringData === 'pause-playback'){
                    videoRef.current?.pause();
                }
                else if(videoRef.current?.paused && stringData === 'resume-playback'){
                    videoRef.current?.play();
                }
            });
        };

        const emitResumePlaybackEvent = () => {
            peerRef.current?.send('resume-playback');
        };

        const emitPausePlaybackEvent = () =>{
            peerRef.current?.send('pause-playback');
        }

        videoRef.current?.addEventListener('pause',emitPausePlaybackEvent);
        videoRef.current?.addEventListener('play',emitResumePlaybackEvent);

        return () => {
            console.log('Disconnecting from socket IO server');
            newSocket.disconnect();
            console.log('Destroying peer');
            peerRef.current?.destroy();
            videoRef.current?.removeEventListener('pause',emitPausePlaybackEvent);
            videoRef.current?.removeEventListener('play',emitResumePlaybackEvent);
        }

    },[]);



    return (
        <>
            <VideoCanvas videoURL={''} ref={videoRef}/>
        </>
    );
}