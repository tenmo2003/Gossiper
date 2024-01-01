import AuthContext from "@/contexts/AuthContext";
import moment from "moment";
import React, { useEffect } from "react";
export function MessageContainer({ messages }: any) {
  const messageContainerRef = React.useRef<any>();
  const { user } = React.useContext<any>(AuthContext);

  useEffect(() => {
    messageContainerRef.current.scrollTop =
      messageContainerRef.current.scrollHeight;
  }, [messages]);

  return (
    <div
      ref={messageContainerRef}
      className="flex flex-col gap-1 flex-1 overflow-auto px-2 py-1 mb-2"
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
              {message.sender.fullName} - {moment(message.timestamp).fromNow()}
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
  );
}
