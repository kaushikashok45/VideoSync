import Role from "../contracts/Role";
import SessionContext from "../logic/SessionContext";
import { useState } from "react";

export default function SessionContextProvider({ children }: any) {
    const [context, setContext] = useState({
        roomId: "room142",
        userName: "anonymous user",
        role: Role.GUEST,
    });

    const updateRoomId = (roomId: string) => {
        setContext({
            ...context,
            roomId,
        });
    };

    const updateUserName = (userName: string) => {
        setContext({
            ...context,
            userName,
        });
    };

    const updateRole = (role: Role) => {
        setContext({
            ...context,
            role,
        });
    };

    return (
        <SessionContext.Provider
            value={{ ...context, updateRoomId, updateUserName, updateRole }}
        >
            {children}
        </SessionContext.Provider>
    );
}
