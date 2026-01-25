import { useContext } from "react";
import { useNavigate } from "react-router";
import SessionContext from "../../../context/Session/logic/SessionContext";
import type { useFileUploadBehaviorResult } from "../contracts/UploadFile";

export default function useFileUploadBehaviour(): useFileUploadBehaviorResult {
    const { roomId } = useContext(SessionContext);
    const navigate = useNavigate();

    const handleFileUpload: React.ChangeEventHandler<HTMLInputElement> = (
        event
    ) => {
        const file = event.target.files?.[0];
        console.log(file);
        event.target.value = "";
        if (file) {
            const videoURL = URL.createObjectURL(file);
            navigate(`/${roomId}/HostVideoPlayerNew`, {
                state: { videoURL: videoURL },
            });
        }
    };

    return { handleFileUpload };
}
