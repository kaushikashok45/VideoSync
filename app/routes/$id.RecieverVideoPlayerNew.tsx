import {
    useRef,
    useContext,
    MutableRefObject,
    useState,
    useEffect,
} from "react";
import { VideoPlayer } from "../features/videoPlayback/components/VideoPlayer";
import UserNameContext from "../context/UserName/UserNameContext";
import RoomIdContext from "../context/RoomId/RoomIdContext";
import RecieverSocketManager from "~/features/webSocket/logic/RecieverSocketManager";
export default function RecieverVideoPlayerNew() {
    const videoRef: MutableRefObject<HTMLVideoElement | null> = useRef(null);
    const socketManagerRef: MutableRefObject<RecieverSocketManager | null> =
        useRef(null);
    const [videoMeta, setVideoMeta] = useState({
        currentTime: 0,
        duration: 0,
    });
    const { userName } = useContext(UserNameContext);
    const { roomId } = useContext(RoomIdContext);

    function sendPauseSignal() {
        if (!socketManagerRef.current || !videoRef.current) return;
        socketManagerRef.current?.sendPauseSignal();
    }

    function sendResumeSignal() {
        if (!socketManagerRef.current || !videoRef.current) return;
        socketManagerRef.current?.sendResumeSignal();
    }

    function handleTimeUpdate(e) {
        if (!videoRef.current) return;
        const { currentTime } = e.detail;
        setVideoMeta((prevVideoMeta) => ({
            ...prevVideoMeta,
            currentTime,
        }));
    }

    function handleDurationUpdate(e) {
        if (!videoRef.current) return;
        const { duration } = e.detail;
        setVideoMeta((prevVideoMeta) => ({
            ...prevVideoMeta,
            duration,
        }));
    }

    function sendForwardSignal() {
        if (!videoRef.current || !socketManagerRef.current) return;
        socketManagerRef.current.sendForwardSignal();
    }

    function sendRewindSignal() {
        if (!videoRef.current || !socketManagerRef.current) return;
        socketManagerRef.current.sendRewindSignal();
    }

    function sendManualSeek(time: number) {
        if (!videoRef.current || !socketManagerRef.current) return;
        socketManagerRef.current.sendManualSeekSignal(time);
    }

    useEffect(() => {
        socketManagerRef.current = new RecieverSocketManager(
            { userName, roomId },
            videoRef.current as HTMLVideoElement
        );
        videoRef.current?.addEventListener(
            "video-duration",
            handleDurationUpdate
        );
        videoRef.current?.addEventListener(
            "video-current-time",
            handleTimeUpdate
        );

        return () => {
            socketManagerRef.current?.destroy();
            videoRef.current?.removeEventListener(
                "video-duration",
                handleTimeUpdate
            );
            videoRef.current?.removeEventListener(
                "video-current-time",
                handleDurationUpdate
            );
        };
    }, []);

    return (
        <div className="h-[90%] w-[90%] md:h-3/4 md:w-3/4 min-h-3/4 min-w-3/4 rounded-md flex justify-center items-center md:p-[2em] m-auto">
            <VideoPlayer
                videoURL={""}
                getRef={videoRef}
                videoMeta={videoMeta}
                onManualPause={sendPauseSignal}
                onManualResume={sendResumeSignal}
                onManualForward={sendForwardSignal}
                onManualRewind={sendRewindSignal}
                onManualSeek={sendManualSeek}
            />
        </div>
    );
}
