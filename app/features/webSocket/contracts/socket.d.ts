import { Socket } from "socket.io-client";
import { peerSetupMeta } from "../../../utils/peerRegistryContract";

declare namespace webSocket {
    type socketParams = {
        userName: string;
        roomId: string;
    };

    interface SocketManager {
        setupListeners: () => void;
        handleSignal: (data: unknown) => void;
        destroy: () => void;
        getSocket: () => Socket;
        handleConnectionSetup: () => void;
        handleConnectionError: (error: Error) => void;
        handleUserJoined: (data: peerSetupMeta) => void;
        handleUserLeft: (data: peerSetupMeta) => void;
        handleSocketIdRecieved: (data: unknown) => void;
    }
}

export = webSocket;
