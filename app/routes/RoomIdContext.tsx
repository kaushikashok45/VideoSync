import { createContext } from "react";

export type RoomContext = {
  roomId: string;
  updateRoomId: (roomId: string) => void;
};
const RoomIdContext = createContext<RoomContext>({
  roomId: "room142",
  updateRoomId: (roomId: string) => {},
});

export default RoomIdContext;
