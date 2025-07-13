import { useRef, useState, useEffect } from 'react';
import  SimplePeer from 'simple-peer';
import { io, Socket } from 'socket.io-client';

import VideoCanvas from './VideoCanvas';


export default function RecieverVideoPlayer() {

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
            startReceivingStream();
        });

        newSocket.on('disconnect',()=>{
            console.log('Disconnected from socket IO server');
        });

        newSocket.on('signal',(data)=>{
            console.log('Received signal from socket IO server',data);
            if(peerRef.current){
                peerRef.current.signal(data);
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
                if(newSocket?.connected){
                    console.log('Signaling to socket IO server');
                    newSocket.emit('signal', data);
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
        };

        return () => {
            console.log('Disconnecting from socket IO server');
            newSocket.disconnect();
        }

    },[]);



    return (
        <>
            <VideoCanvas videoURL={''} ref={videoRef}/>
        </>
    );
}