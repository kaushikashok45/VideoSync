import { peerSetupMeta } from "../../../utils/peerRegistryContract";
import type {
    SocketManager,
    socketParams,
} from "../contracts/socket";
import { io, Socket } from "socket.io-client";
import { joinedPartySuccessMessage } from "../../toastMessages/logic/toastMessageLibrary";
import { SOCKET_EVENTS } from "~/features/webSocket/contracts/constants";

abstract class BaseSocketManager implements SocketManager {
    protected socket: Socket;
    protected socketMeta: socketParams;
    protected socketId: string | undefined;
    protected videoElement: HTMLVideoElement;

    constructor(socketMeta: socketParams, videoElement: HTMLVideoElement) {
        this.socketMeta = socketMeta;
        this.socket = this.initializeSocket();
        this.videoElement = videoElement;
    }

    private initializeSocket() {
        const SOCKET_SERVER_URL =
            window.location.hostname === "localhost"
                ? `${window.location.protocol}//localhost:5173`
                : window.location.origin;
        return io(SOCKET_SERVER_URL, {
            path: "/socket.io",
            transports: ["websocket", "polling"],
            autoConnect: true,
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionAttempts: 5,
        });
    }

    getSocket(): Socket {
        return this.socket;
    }

    handleUserJoined(data: peerSetupMeta): void {
        console.log("User joined data:", data);
        const { userName, peerId } = data;
        console.log(`${userName}:${peerId} joined the room.`);
        joinedPartySuccessMessage(userName);
    }

    handleUserLeft(data: peerSetupMeta): void {
        console.log("User left data:", data);
        //TODO: Implement user left handling
    }

    handleConnectionSetup(): void {
        console.log("Connected to socket server");
        this.socket.emit("join-room", this.socketMeta);
    }

    handleSocketIdRecieved(data: unknown): void {
        const { peerId } = data as { peerId: string };
        this.socketId = peerId;
    }

    setupListeners(): void {
        this.socket.on(
            SOCKET_EVENTS.USER_JOINED,
            this.handleUserJoined.bind(this)
        );
        this.socket.on(SOCKET_EVENTS.USER_LEFT, this.handleUserLeft.bind(this));
        this.socket.on(
            SOCKET_EVENTS.CONNECT,
            this.handleConnectionSetup.bind(this)
        );
        this.socket.on(
            SOCKET_EVENTS.SOCKET_ID_META,
            this.handleSocketIdRecieved.bind(this)
        );
    }

    abstract handleSignal(data: unknown): void;
    abstract destroy(): void;
    abstract handleConnectionError(error: Error): void;
}

export default BaseSocketManager;
