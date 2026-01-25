declare namespace Session {
    type SessionData = {
        roomId: string;
        userName: string;
        role: Role;
        updateRoomId: (roomId: string) => void;
        updateUserName: (userName: string) => void;
        updateRole: (role: Role) => void;
    };
}

export = Session;
