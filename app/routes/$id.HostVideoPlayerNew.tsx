import { useRef, useContext, useEffect, MutableRefObject } from "react";
import { useLocation } from "react-router";
import { VideoPlayer } from "../features/videoPlayback/components/VideoPlayer";
import SessionContext from "../context/Session/logic/SessionContext";
import HostSocketManager from "~/features/webSocket/logic/HostSocketManager";

export default function HostVideoPlayerNew() {
    const location = useLocation();
    const passedState = location.state as { videoURL: string };
    const videoRef = useRef<HTMLVideoElement>(null);
    const socketManagerRef: MutableRefObject<HostSocketManager | null> =
        useRef(null);
    const { userName, roomId } = useContext(SessionContext);

    function pausePlaybackForAllPeers(e) {
        const initiator =
            e && e.detail.userName ? e.detail.userName : undefined;
        if (!socketManagerRef.current) return;
        socketManagerRef.current.pausePlaybackForAllPeers(initiator);
    }

    function resumePlaybackForAllPeers(e) {
        const initiator =
            e && e.detail.userName ? e.detail.userName : undefined;
        if (!socketManagerRef.current) return;
        socketManagerRef.current.resumePlaybackForAllPeers(initiator);
    }

    function forwardPlaybackForAllPeers(e) {
        const initiator = e && e.detail.userName ? e.detail.userName : userName;
        socketManagerRef.current?.forwardPlaybackForAllPeers(initiator);
    }

    function rewindPlaybackForAllPeers(e) {
        const initiator = e && e.detail.userName ? e.detail.userName : userName;
        socketManagerRef.current?.rewindPlaybackForAllPeers(initiator);
    }

    function seekPlaybackForAllPeers(e) {
        const initiator =
            e && isNaN(e) && e.detail.userName ? e.detail.userName : userName;
        const currentTime = e && isNaN(e) && e.detail.time ? e.detail.time : 0;
        socketManagerRef.current?.seekPlaybackForAllPeers(
            initiator,
            currentTime
        );
    }

    useEffect(() => {
        socketManagerRef.current = new HostSocketManager(
            { userName, roomId },
            videoRef.current as HTMLVideoElement
        );
        videoRef.current?.addEventListener(
            "pause-playback",
            pausePlaybackForAllPeers
        );
        videoRef.current?.addEventListener(
            "resume-playback",
            resumePlaybackForAllPeers
        );
        videoRef.current?.addEventListener(
            "forward-playback",
            forwardPlaybackForAllPeers
        );
        videoRef.current?.addEventListener(
            "rewind-playback",
            rewindPlaybackForAllPeers
        );
        videoRef.current?.addEventListener(
            "seek-playback",
            seekPlaybackForAllPeers
        );
        return () => {
            socketManagerRef.current?.destroy();
            videoRef.current?.removeEventListener(
                "pause-playback",
                pausePlaybackForAllPeers
            );
            videoRef.current?.removeEventListener(
                "resume-playback",
                resumePlaybackForAllPeers
            );
            videoRef.current?.removeEventListener(
                "forward-playback",
                forwardPlaybackForAllPeers
            );
            videoRef.current?.removeEventListener(
                "rewind-playback",
                rewindPlaybackForAllPeers
            );
            videoRef.current?.removeEventListener(
                "seek-playback",
                seekPlaybackForAllPeers
            );
        };
    }, []);

    return (
        <div className="h-[90%] w-[90%] md:h-3/4 md:w-3/4 min-h-3/4 min-w-3/4 rounded-md flex justify-center items-center md:p-[2em] m-auto">
            <VideoPlayer
                videoURL={passedState.videoURL}
                getRef={videoRef}
                onManualPause={pausePlaybackForAllPeers}
                onManualResume={resumePlaybackForAllPeers}
                onManualForward={forwardPlaybackForAllPeers}
                onManualRewind={rewindPlaybackForAllPeers}
                onManualSeek={seekPlaybackForAllPeers}
            ></VideoPlayer>
        </div>
    );
}
