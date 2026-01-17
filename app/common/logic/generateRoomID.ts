import { nanoid } from 'nanoid';
export default function  generateRoomID(): string {
  const roomId = `VideoSync${nanoid()}`;
  return roomId;
}