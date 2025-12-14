import { Link, useLocation } from "@remix-run/react";
import { useContext } from "react";
import { nanoid } from "nanoid";
import UserNameContext from "../context/UserName/UserNameContext";
import RoomIdContext from "../context/RoomId/RoomIdContext";
import UnifiedButton from "~/components/UnifiedButton";

const roomId = nanoid();

export default function SetupScreen() {
  const { userName } = useContext(UserNameContext);
  const { updateRoomId } = useContext(RoomIdContext);
  const location = useLocation();
  const pathName = location.pathname;
  const inferredRoomId = pathName.split("/")[1];
  return (
    <div
      id="setup-screen"
      className={`flex flex-col h-full justify-center items-center gap-5 px-[2em] mx-auto my-auto`}
    >
      <h2 className={`text-xl md:text-3xl`}>
        Howdy{" "}
        <span className={`font-yesteryear text-2xl md:text-4xl text-red-600`}>
          {userName}
        </span>{" "}
        ! What would you like to do?
      </h2>
      <div
        id="party-options"
        className={`flex flex-col md:flex-row gap-8 items-center md:justify-between`}
      >
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
      </div>
    </div>
  );
}
