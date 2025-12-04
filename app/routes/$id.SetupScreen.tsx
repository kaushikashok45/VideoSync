import { Link } from "@remix-run/react";

import Button from "./Button";
import UserNameContext from "~/routes/UserNameContext";
import { useContext } from "react";
import { nanoid } from "nanoid";
import { useLocation } from "@remix-run/react";
import RoomIdContext from "./RoomIdContext";

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
      <h2 className={`text-3xl`}>
        Howdy <span className={`font-yesteryear text-red-600`}>{userName}</span>{" "}
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
          <Button buttonLabel={"Host party"} buttonClass={"primary"}></Button>
        </Link>
        <Link
          to={`/${inferredRoomId}/RecieverVideoPlayerNew`}
          onClick={() => {
            updateRoomId(inferredRoomId);
          }}
        >
          <Button buttonLabel={"Join party"} buttonClass={"secondary"}></Button>
        </Link>
      </div>
    </div>
  );
}
