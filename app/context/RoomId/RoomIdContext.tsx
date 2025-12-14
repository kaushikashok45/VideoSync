import { createContext } from "react";
import RoomContext from "./types/RoomContext";

const RoomIdContext = createContext<RoomContext>({
  roomId: "room142",
  updateRoomId: (roomId: string) => {
    console.log(roomId);
  },
});

export default RoomIdContext;
