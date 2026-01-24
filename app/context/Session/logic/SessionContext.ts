import { createContext } from "react";
import type { SessionData } from "../contracts/Session";
import Role from "../contracts/Role";

const SessionContext = createContext<SessionData>({
    roomId: "room142",
    userName: "anonymous user",
    role: Role.GUEST,
    updateRoomId: (roomId: string) => {
        console.log(roomId);
    },
    updateUserName: (userName: string) => {
        console.log(userName);
    },
    updateRole: (role: Role) => {
        console.log(role);
    },
});

export default SessionContext;
