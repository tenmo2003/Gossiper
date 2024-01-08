import AuthContext from "@/contexts/AuthContext";
import {
  MESSAGE_EVENT,
  PRIVATE_CHAT_TYPE,
  TEMP_CHAT_PREFIX,
} from "@/helpers/constants";
import { formatter } from "@/helpers/helpers";
import { SendOutlined } from "@ant-design/icons";
import React, { useEffect, useState } from "react";
import EmojiPicker, {
  EmojiStyle,
  SuggestionMode,
  Theme,
} from "emoji-picker-react";
import { BsEmojiNeutral } from "react-icons/bs";
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
    if (!chat) return;

    console.log(chat);

    if (chat._id.startsWith(TEMP_CHAT_PREFIX)) {
      setChatName(chat.tmpWith.fullName);
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

    const map = new Map();
    chat?.users?.forEach((user: any) => {
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
  }, [chat]);

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
      images: images,
      chatId: chat._id,
    });
    if (chat._id?.startsWith(TEMP_CHAT_PREFIX)) {
      setInitNewChat(true);
    }
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

  useEffect(() => {
    document.getElementById("messageInput")?.addEventListener("paste", (e) => {
      if (e.clipboardData?.files?.length) {
        e.preventDefault();
        setImages((prev: any) => [...prev, ...e.clipboardData.files]);
        return;
      }
    });
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
      >
        <div className="flex flex-col-reverse gap-1 flex-1">
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
          {loading && (
            <div className="w-full text-center text-3xl">
              <LoadingOutlined />
            </div>
          )}
        </div>
      </div>
      <div className="flex gap-2 items-end">
        <TextArea
          ref={messageInputRef}
          id="messageInput"
          className="bg-gray-700 p-2 w-full text-base"
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
            onClick={() => setEmojiPickerOpen((prev) => !prev)}
          >
            <BsEmojiNeutral className="text-2xl" />
          </div>
          {emojiPickerOpen && (
            <div className="absolute top-0 right-0 -translate-x-1 -translate-y-full">
              <EmojiPicker
                theme={Theme.DARK}
                suggestedEmojisMode={SuggestionMode.RECENT}
                previewConfig={{ showPreview: false }}
                onEmojiClick={(emoji: any) => {
                  setCurrentInput((prev) => prev + emoji.emoji);
                  setEmojiPickerOpen(false);
                }}
                emojiVersion={"4.0"}
                emojiStyle={EmojiStyle.NATIVE}
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
