import SimplePeer from "simple-peer";
import PeerDataChannelUtil from "./peerDataChannelUtil";

export type peerMeta = {
  userName: string;
  peerInstance: SimplePeer.Instance;
  peerDataChannel: PeerDataChannelUtil;
};

export type peerSetupMeta = {
  userName: string;
  peerId: string;
};

export type socketReceiverJoinRoomMeta = {
  userName: string;
  roomId: string;
};
