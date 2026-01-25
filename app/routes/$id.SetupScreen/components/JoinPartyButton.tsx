import { Link, useLocation } from "react-router";
import { useContext } from "react";
import UnifiedButton from "~/common/components/UnifiedButton";
import SessionContext from "../../../context/Session/logic/SessionContext";

export default function HostPartyButton() {
    const { updateRoomId } = useContext(SessionContext);
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
