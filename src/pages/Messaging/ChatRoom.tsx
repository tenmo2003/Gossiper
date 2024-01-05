import { PRIVATE_CHAT_TYPE } from "@/helpers/constants";
import { socket } from "@/socket.io/socket";
import { Avatar } from "antd";
import TimeAgo from "react-timeago";

export default function ChatRoom({ room, user }: any) {
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
      className="flex items-center gap-3"
      onClick={() => socket.emit("joinPrivate")}
    >
      <Avatar
        size={70}
        src={roomAvatar ? roomAvatar : "/src/assets/user.png"}
      />
      <div className="flex flex-col justify-between">
        <div>
          <span className="text-lg">{roomName}</span>
        </div>
        <div className="text-gray-400">
          <TimeAgo date={room.lastMessage.createdAt} />{" "}
          {room.lastMessage.content}
        </div>
      </div>
    </div>
  );
}
