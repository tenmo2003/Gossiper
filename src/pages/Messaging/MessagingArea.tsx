import AuthContext from "@/contexts/AuthContext";
import CurrentRoomContext from "@/contexts/CurrentRoomContext";
import {
  MESSAGE_EVENT,
  PRIVATE_CHAT_TYPE,
  TEMP_CHAT_PREFIX,
  TEXT_MESSAGE_TYPE,
} from "@/helpers/constants";
import { formatter } from "@/helpers/helpers";
import service from "@/service/service";
import { socket } from "@/socket.io/socket";
import { LoadingOutlined, SendOutlined } from "@ant-design/icons";
import data from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import { Image } from "antd";
import TextArea from "antd/es/input/TextArea";
import React, { useEffect, useState } from "react";
import { BsEmojiNeutral } from "react-icons/bs";
import TimeAgo from "react-timeago";
import { toast } from "sonner";

export function MessagingArea() {
  const { user } = React.useContext<any>(AuthContext);
  const { currentlyJoinedRoom } = React.useContext<any>(CurrentRoomContext);

  const messageContainerRef = React.useRef<any>();
  const [messages, setMessages] = useState<any>([]);

  const [currentInput, setCurrentInput] = useState("");

  const [chatName, setChatName] = React.useState<string>("");
  const [usersMap, setUsersMap] = React.useState<Map<string, any>>();

  const [initLoading, setInitLoading] = useState(false);

  const [loading, setLoading] = useState(false);
  const [noMoreData, setNoMoreData] = useState(false);
  const messageQuerySize = 20;

  const [initNewChat, setInitNewChat] = useState(false);

  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);

  const messageInputRef = React.useRef<any>();
  const [images, setImages] = useState<any>([]);

  useEffect(() => {
    if (!currentlyJoinedRoom) return;

    if (currentlyJoinedRoom._id.startsWith(TEMP_CHAT_PREFIX)) {
      setChatName(currentlyJoinedRoom.tmpWith.fullName);
      setMessages([]);
      setImages([]);
      return;
    }

    setCurrentInput("");
    setImages([]);

    setInitLoading(true);
    service
      .get("/chats/messages/" + currentlyJoinedRoom._id, {
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
      currentlyJoinedRoom.type === PRIVATE_CHAT_TYPE
        ? currentlyJoinedRoom.users[0]._id === user._id
          ? currentlyJoinedRoom.users[1].fullName
          : currentlyJoinedRoom.users[0].fullName
        : currentlyJoinedRoom.groupName
    );

    setNoMoreData(false);

    const map = new Map();
    currentlyJoinedRoom?.users?.forEach((user: any) => {
      map.set(user._id, user);
    });

    setInitNewChat(false);

    setUsersMap(map);

    socket.on(MESSAGE_EVENT, (data) => {
      setMessages((prev: any) => [data, ...prev]);
    });

    return () => {
      socket.off(MESSAGE_EVENT);
    };
  }, [currentlyJoinedRoom]);

  const sendMessage = () => {
    if (!currentInput && !images.length) {
      toast("Please enter a message", { position: "top-center" });
      return;
    }
    socket.emit(MESSAGE_EVENT, {
      newMessage: currentlyJoinedRoom._id?.startsWith(TEMP_CHAT_PREFIX),
      message: {
        content: currentInput,
        sender: user._id,
        images: images,
      },
      chatId: currentlyJoinedRoom._id,
    });
    if (currentlyJoinedRoom._id?.startsWith(TEMP_CHAT_PREFIX)) {
      setInitNewChat(true);
    }
    setCurrentInput("");
    setImages([]);
  };

  const fetchMoreData = () => {
    setLoading(true);
    service
      .get("/chats/messages/" + currentlyJoinedRoom._id, {
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

  useEffect(() => {
    document.getElementById("messageInput")?.addEventListener("paste", (e) => {
      if (e.clipboardData?.files?.length) {
        e.preventDefault();
        console.log(e.clipboardData.files.length);
        setImages((prev: any) => [...prev, ...e.clipboardData.files]);
        return;
      }
    });

    return () => {
      document
        .getElementById("messageInput")
        ?.removeEventListener("paste", () => {});
    };
  }, []);

  useEffect(() => {
    console.log("images >>>", images);
  }, [images]);

  return (
    <>
      <div className="text-center font-bold text-2xl mb-3">{chatName}</div>
      <div
        ref={messageContainerRef}
        className="flex flex-col-reverse gap-1 flex-1 px-2 py-1 mb-2 overflow-auto"
        onScroll={(e: any) => {
          // check if user is 90% to top
          if (
            !loading &&
            !noMoreData &&
            e.target.scrollTop < e.target.scrollHeight * 0.1
          ) {
            fetchMoreData();
          }
        }}
        onClick={() => messageInputRef.current?.focus()}
      >
        <div className="flex flex-col-reverse gap-1 flex-1">
          {initLoading ? (
            <div className="w-full h-full flex items-center justify-center">
              <LoadingOutlined spin size={30} className="text-white text-3xl" />
            </div>
          ) : (
            messages.map((message: any, index: number) => (
              <div
                className={`border border-gray-700 text-lg text-white rounded-lg max-w-[65%]
                    ${
                      message.sender === user._id
                        ? "self-end bg-primary"
                        : "self-start"
                    }`}
                key={index}
              >
                {message.type === TEXT_MESSAGE_TYPE ? (
                  <div className="p-2">
                    {message.sender !== user._id && (
                      <span>
                        {usersMap?.get(message.sender)?.fullName} -{" "}
                        <TimeAgo
                          date={message.createdAt}
                          formatter={formatter}
                        />
                      </span>
                    )}
                    <div>
                      <span
                        dangerouslySetInnerHTML={{
                          __html: message.content.replace(/\n/g, "<br/>"),
                        }}
                        className="break-words"
                      ></span>
                    </div>
                  </div>
                ) : (
                  <div>
                    <Image src={message.content} />
                  </div>
                )}
              </div>
            ))
          )}
          {loading && (
            <div className="w-full text-center text-3xl">
              <LoadingOutlined />
            </div>
          )}
        </div>
      </div>
      <div className="flex gap-2 items-end pr-3">
        <TextArea
          ref={messageInputRef}
          id="messageInput"
          className="bg-gray-700 p-2 w-full text-lg"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
          onChange={(e) => {
            setCurrentInput(e.target.value);
          }}
          disabled={initNewChat}
          value={currentInput}
          autoSize={{ maxRows: 5 }}
          placeholder="Type your message here..."
        />
        <div className="py-2 px-1 relative">
          <div
            className="cursor-pointer hover:text-[#6899d9] transition-all duration-100"
            onClick={() =>
              setTimeout(() => {
                if (!emojiPickerOpen) {
                  setEmojiPickerOpen(true);
                }
              })
            }
          >
            <BsEmojiNeutral className="text-2xl" />
          </div>
          {emojiPickerOpen && (
            <div className="absolute top-0 right-0 -translate-x-1 -translate-y-full">
              <Picker
                data={data}
                onEmojiSelect={(emoji: any) => {
                  console.log(emoji);
                  setCurrentInput((prev) => prev + emoji.native);
                }}
                onClickOutside={() => {
                  setEmojiPickerOpen((prev) => !prev);
                }}
                theme="dark"
                skinTonePosition="search"
                emojiSize={30}
                navPosition="bottom"
              />
            </div>
          )}
        </div>
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
