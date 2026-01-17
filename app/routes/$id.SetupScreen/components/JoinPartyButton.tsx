import { Link, useLocation } from "@remix-run/react";
import { useContext } from "react";
import UnifiedButton from "~/common/components/UnifiedButton";
import RoomIdContext from "../../../context/RoomId/RoomIdContext";


export default function HostPartyButton(){
    const { updateRoomId } = useContext(RoomIdContext);
    const location = useLocation();
    const pathName = location.pathname;
    const inferredRoomId = pathName.split("/")[1];
    
    return (
         <Link
           to={`/${inferredRoomId}/RecieverVideoPlayerNew`}
           onClick={() => {
           updateRoomId(inferredRoomId);
           }}
         >
            <UnifiedButton
            buttonLabel={"Join party"}
            classList={"bg-blue-700 shadow-blue-700 text-white"}
            ></UnifiedButton>
        </Link>
    );
}