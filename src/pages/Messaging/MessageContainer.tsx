import AuthContext from "@/contexts/AuthContext";
import { PRIVATE_CHAT_TYPE } from "@/helpers/constants";
import { formatter } from "@/helpers/helpers";
import React, { useEffect } from "react";
import TimeAgo from "react-timeago";

import { LoadingOutlined } from "@ant-design/icons";
export function MessageContainer({ chat, messages, loading }: any) {
  const messageContainerRef = React.useRef<any>();
  const { user } = React.useContext<any>(AuthContext);

  const [chatName, setChatName] = React.useState<string>("");

  const [usersMap, setUsersMap] = React.useState<Map<string, any>>();

  useEffect(() => {
    setChatName(
      chat.type === PRIVATE_CHAT_TYPE
        ? chat.users[0]._id === user._id
          ? chat.users[1].fullName
          : chat.users[0].fullName
        : chat.groupName
    );

    const map = new Map();
    chat?.users?.forEach((user: any) => {
      map.set(user._id, user);
    });

    setUsersMap(map);
  }, [chat]);

  useEffect(() => {
    messageContainerRef.current.scrollTop =
      messageContainerRef.current.scrollHeight;
  }, [messages]);

  return (
    <>
      <div className="text-center font-bold text-2xl mb-3">
        {chatName || chat.tmpWith?.fullName}
      </div>
      <div
        ref={messageContainerRef}
        className="flex flex-col gap-1 flex-1 overflow-auto px-2 py-1 mb-2 justify-end"
      >
        {loading ? (
          <div className="w-full h-full flex items-center justify-center">
            <LoadingOutlined spin size={30} className="text-white text-3xl" />
          </div>
        ) : (
          messages.map((message: any, index: number) => (
            <div
              className={`border border-gray-700 p-2 text-white rounded-lg max-w-[50%]
                  ${
                    message.sender === user._id
                      ? "self-end bg-primary"
                      : "self-start"
                  }`}
              key={index}
            >
              {message.sender !== user._id && (
                <span>
                  {usersMap?.get(message.sender)?.fullName} -{" "}
                  <TimeAgo date={message.createdAt} formatter={formatter} />
                </span>
              )}
              <div>
                <span
                  dangerouslySetInnerHTML={{
                    __html: message.content.replace(/\n/g, "<br/>"),
                  }}
                ></span>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
}
