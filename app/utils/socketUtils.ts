import { io, Socket } from "socket.io-client";
import { peerSignal } from "./peerSignalContract";
import { peerSetupMeta } from "./peerRegistryContract";
import { joinedPartySuccessMessage } from "~/toastMessages/toastMessageLibrary";

type socketMeta = {
  socketId: string;
};

type socketParams = {
  userName: string;
  roomId: string;
  onConnectCallback?: () => void;
  onUserJoinCallback?: (userDetails: peerSetupMeta) => void;
  onReceivingSocketMetaCallback?: (socketDetails: socketMeta) => void;
  onSignalCallback?: (signal: peerSignal) => void;
};

export function createSocket(params: socketParams): Socket {
  const SOCKET_SERVER_URL = `${window.location.protocol}//localhost:3001`;
  const socket = io(SOCKET_SERVER_URL);

  socket.on("connect", () => {
    console.log("Connected to socket server");
    socket.emit("join-room", {
      userName: params.userName,
      roomId: params.roomId,
    });
    params.onConnectCallback && params.onConnectCallback();
  });

  socket.on("user-joined", (data: peerSetupMeta) => {
    console.log("User joined data:", data);
    const { userName, peerId } = data;
    console.log(`${userName}:${peerId} joined the room.`);
    joinedPartySuccessMessage(userName);
    params.onUserJoinCallback && params.onUserJoinCallback(data);
  });

  socket.on("socket-id-meta", (data) => {
    console.log("Received socket id:", data);
    params.onReceivingSocketMetaCallback &&
      params.onReceivingSocketMetaCallback(data);
  });

  socket.on("signal", (data) => {
    console.log("Received signal via signalling server");
    params.onSignalCallback && params.onSignalCallback(data);
  });

  socket.on("disconnect", () => {
    console.log("Disconnected from socket server");
  });

  socket.on("connect_error", (err) => {
    console.error("Error connecting to socket IO server", err.message);
  });

  return socket;
}
