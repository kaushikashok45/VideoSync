import { useContext } from "react";
import { useNavigate } from "@remix-run/react";
import RoomIdContext from "../../../context/RoomId/RoomIdContext";
import type { useFileUploadBehaviorResult } from "../contracts/UploadFile";

export default function useFileUploadBehaviour(): useFileUploadBehaviorResult {
    const { roomId } = useContext(RoomIdContext);
    const navigate = useNavigate();

    const handleFileUpload: React.ChangeEventHandler<HTMLInputElement> = (event) => {
        const file = event.target.files?.[0];
        console.log(file);
        event.target.value = "";
        if (file) {
          const videoURL = URL.createObjectURL(file);
          navigate(`/${roomId}/HostVideoPlayerNew`, {
            state: { videoURL: videoURL },
          });
        }
    }

    return { handleFileUpload };
}