import AuthContext from "@/contexts/AuthContext";
import { PRIVATE_CHAT_TYPE } from "@/helpers/constants";
import moment from "moment";
import React, { useEffect } from "react";
export function MessageContainer({ chat, messages }: any) {
  const messageContainerRef = React.useRef<any>();
  const { user } = React.useContext<any>(AuthContext);

  const [chatName, setChatName] = React.useState<string>("");

  useEffect(() => {
    setChatName(
      chat.type === PRIVATE_CHAT_TYPE
        ? chat.users[0]._id === user._id
          ? chat.users[1].fullName
          : chat.users[0].fullName
        : chat.groupName
    );
  }, [chat]);

  useEffect(() => {
    messageContainerRef.current.scrollTop =
      messageContainerRef.current.scrollHeight;
  }, [messages]);

  return (
    <>
      <div className="text-center font-bold text-2xl mb-3">{chatName}</div>
      <div
        ref={messageContainerRef}
        className="flex flex-col gap-1 flex-1 overflow-auto px-2 py-1 mb-2 justify-end"
      >
        {messages.map((message: any, index: number) => (
          <div
            className={`border border-gray-700 p-2 text-white rounded-lg max-w-[50%]
                  ${
                    message.sender.username === user.username
                      ? "self-end bg-primary"
                      : "self-start"
                  }`}
            key={index}
          >
            {message.sender.username !== user.username && (
              <span>
                {message.sender.fullName} -{" "}
                {moment(message.timestamp).fromNow()}
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
        ))}
      </div>
    </>
  );
}
