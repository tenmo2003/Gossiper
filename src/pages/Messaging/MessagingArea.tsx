import AuthContext from "@/contexts/AuthContext";
import {
  MESSAGE_EVENT,
  PRIVATE_CHAT_TYPE,
  TEMP_CHAT_PREFIX,
} from "@/helpers/constants";
import { formatter } from "@/helpers/helpers";
import { SendOutlined } from "@ant-design/icons";
import React, { useEffect, useRef, useState } from "react";
import TimeAgo from "react-timeago";

import service from "@/service/service";
import { socket } from "@/socket.io/socket";
import { LoadingOutlined } from "@ant-design/icons";
import TextArea from "antd/es/input/TextArea";
import { toast } from "sonner";
export function MessagingArea({ chat }: any) {
  const { user } = React.useContext<any>(AuthContext);

  const messageContainerRef = React.useRef<any>();
  const [messages, setMessages] = useState<any>([]);

  const textAreaRef = useRef<any>();
  const [currentInput, setCurrentInput] = useState("");

  const [chatName, setChatName] = React.useState<string>("");
  const [usersMap, setUsersMap] = React.useState<Map<string, any>>();

  const [initLoading, setInitLoading] = useState(false);

  const [loading, setLoading] = useState(false);
  const [noMoreData, setNoMoreData] = useState(false);
  const messageQuerySize = 20;

  useEffect(() => {
    socket.on(MESSAGE_EVENT, (data) => {
      setMessages((prev: any) => [data, ...prev]);
    });

    return () => {
      socket.off(MESSAGE_EVENT);
    };
  }, []);

  useEffect(() => {
    if (!chat) return;

    if (chat._id.startsWith(TEMP_CHAT_PREFIX)) {
      setMessages([]);
      return;
    }

    setInitLoading(true);
    service
      .get("/chats/messages/" + chat._id, {
        params: {
          o: 0,
          l: messageQuerySize,
        },
      })
      .then((res) => {
        setMessages(res.data.results);
        if (res.data.results.length < messageQuerySize) {
          setNoMoreData(true);
        }
        setInitLoading(false);
      })
      .catch(() => {
        setInitLoading(false);
      });

    setChatName(
      chat.type === PRIVATE_CHAT_TYPE
        ? chat.users[0]._id === user._id
          ? chat.users[1].fullName
          : chat.users[0].fullName
        : chat.groupName
    );

    setNoMoreData(false);
    console.log("newChat");

    const map = new Map();
    chat?.users?.forEach((user: any) => {
      map.set(user._id, user);
    });

    setUsersMap(map);
  }, [chat]);

  useEffect(() => {
    // if (
    //   messageContainerRef.current.scrollTop +
    //     messageContainerRef.current.clientHeight >=
    //   messageContainerRef.current.scrollHeight * 0.95
    // ) {
    //   messageContainerRef.current.scrollTop =
    //     messageContainerRef.current.scrollHeight;
    // }
    console.log(messages);
  }, [messages]);

  const sendMessage = () => {
    if (!currentInput) {
      toast("Please enter a message", { position: "top-center" });
      return;
    }
    socket.emit(MESSAGE_EVENT, {
      newMessage: chat._id?.startsWith(TEMP_CHAT_PREFIX),
      message: {
        content: currentInput,
        sender: user._id,
      },
      chatId: chat._id,
    });
    setCurrentInput("");
  };

  const fetchMoreData = () => {
    setLoading(true);
    service
      .get("/chats/messages/" + chat._id, {
        params: {
          o: messages.length,
          l: messageQuerySize,
        },
      })
      .then((res) => {
        setMessages((messages: any) => [...messages, ...res.data.results]);
        if (res.data.results.length < messageQuerySize) {
          setNoMoreData(true);
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  };

  return (
    <>
      <div className="text-center font-bold text-2xl mb-3">
        {chatName || chat.tmpWith?.fullName}
      </div>
      <div
        ref={messageContainerRef}
        className="flex flex-col-reverse gap-1 flex-1 px-2 py-1 mb-2 overflow-auto"
        onScroll={(e: any) => {
          // check if user is 90% to top
          if (
            !loading &&
            !noMoreData &&
            e.target.scrollTop <
              e.target.scrollHeight * 0.1
          ) {
            fetchMoreData();
          }
        }}
      >
        <div className="flex flex-col-reverse gap-1 justify-end flex-1">
          {initLoading ? (
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
      </div>
      <div className="flex gap-2 items-end">
        <TextArea
          ref={textAreaRef}
          className="bg-gray-700 p-2 w-full text-base"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
          onChange={(e) => {
            setCurrentInput(e.target.value);
            textAreaRef.current.scrollTop = textAreaRef.current.scrollHeight;
          }}
          value={currentInput}
          autoSize={{ maxRows: 5 }}
        />
        <div
          onClick={sendMessage}
          className="bg-primary rounded-full py-2 px-3 hover:bg-[#6899d9] transition-all duration-100 cursor-pointer"
        >
          <SendOutlined />
        </div>
      </div>
    </>
  );
}
