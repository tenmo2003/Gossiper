import {
  JOIN_BY_ID_EVENT,
  PRIVATE_CHAT_TYPE,
  TEXT_MESSAGE_TYPE,
} from "@/helpers/constants";
import { formatter } from "@/helpers/helpers";
import { Avatar } from "antd";
import TimeAgo from "react-timeago";
import defaultAvatarUrl from "/src/assets/user.png";
import { socket } from "@/socket.io/socket";
import CurrentRoomContext from "@/contexts/CurrentRoomContext";
import { useContext } from "react";

export default function ChatRoom({ room, user, setSidebarOpen }: any) {
  const { currentlyJoinedRoom, setCurrentlyJoinedRoom } =
    useContext(CurrentRoomContext);

  const roomName =
    room.type === PRIVATE_CHAT_TYPE
      ? room.users[0]._id === user._id
        ? room.users[1].fullName
        : room.users[0].fullName
      : room.groupName;

  const roomAvatar =
    room.type === PRIVATE_CHAT_TYPE
      ? room.users[0]._id === user._id
        ? room.users[1].avatar
        : room.users[0].avatar
      : room.groupAvatar;

  return (
    <div
      className={`flex items-center gap-3 px-3 py-2 cursor-pointer w-full ${
        currentlyJoinedRoom && currentlyJoinedRoom._id === room._id
          ? "bg-[#1d3354]"
          : "hover:bg-gray-700"
      } transition-all duration-100`}
      onClick={() => {
        if (setSidebarOpen) setSidebarOpen(false);
        setCurrentlyJoinedRoom(room);
        socket.emit(JOIN_BY_ID_EVENT, { roomId: room._id });
      }}
    >
      <Avatar
        size={60}
        className="w-[5rem] h-[5rem] flex-shrink-0"
        src={roomAvatar ? roomAvatar : defaultAvatarUrl}
      />
      <div className="flex flex-col flex-1 justify-between max-w-full">
        <div>
          <span className="text-lg">{roomName}</span>
        </div>
        <div className="text-gray-400 text-base flex gap-1">
          {room.lastMessage?.sender === user._id && "You:"}
          {room.lastMessage?.type === TEXT_MESSAGE_TYPE ? (
            <span className="text-ellipsis whitespace-nowrap overflow-hidden xl:max-w-[15rem] max-w-[10rem]">
              {room.lastMessage.content}
            </span>
          ) : (
            <span>Sent an image</span>
          )}
          {"-"}
          <TimeAgo date={room.lastMessage.createdAt} formatter={formatter} />
        </div>
      </div>
    </div>
  );
}
