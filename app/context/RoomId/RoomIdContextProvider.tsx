import RoomIdContext from "./RoomIdContext";
import { useState } from "react";

export default function RoomIdContextProvider({ children }: any) {
  const [context, setContext] = useState("room142");

  const updateRoomId = (roomId: string) => {
    setContext(roomId);
  };

  return (
    <RoomIdContext.Provider value={{ roomId: context, updateRoomId }}>
      {children}
    </RoomIdContext.Provider>
  );
}
