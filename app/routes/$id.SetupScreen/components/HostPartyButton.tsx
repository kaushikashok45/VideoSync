import { Link } from "@remix-run/react";
import { useContext } from "react";
import UnifiedButton from "~/common/components/UnifiedButton";
import generateRoomID from "~/common/logic/generateRoomID";
import RoomIdContext from "../../../context/RoomId/RoomIdContext";


export default function HostPartyButton(){
    const roomId = generateRoomID();
    const { updateRoomId } = useContext(RoomIdContext);
    return (
         <Link
          to={`/${roomId}/UploadFile`}
          onClick={() => {
            updateRoomId(roomId);
          }}
        >
          <UnifiedButton
            buttonLabel={"Host party"}
            classList={"bg-red-700 shadow-red-700 text-white"}
          ></UnifiedButton>
        </Link>
    );
}