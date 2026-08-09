import Role from "../contracts/Role";
import SessionContext from "../logic/SessionContext";
import { type ReactNode, useState } from "react";

export default function SessionContextProvider(
  { children }: { children?: ReactNode },
) {
  const [context, setContext] = useState({
    roomId: "",
    userName: "",
    role: Role.GUEST,
  });

  const updateRoomId = (roomId: string) => {
    setContext((current) => ({ ...current, roomId }));
  };

  const updateUserName = (userName: string) => {
    setContext((current) => ({ ...current, userName }));
  };

  const updateRole = (role: Role) => {
    setContext((current) => ({ ...current, role }));
  };

  return (
    <SessionContext.Provider
      value={{ ...context, updateRoomId, updateUserName, updateRole }}
    >
      {children}
    </SessionContext.Provider>
  );
}
