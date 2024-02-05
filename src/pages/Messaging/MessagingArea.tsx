import AuthContext from "@/contexts/AuthContext";
import CurrentRoomContext from "@/contexts/CurrentRoomContext";
import {
  HENTAI_PREDICTION,
  IMAGE_MESSAGE_TYPE,
  MESSAGE_EVENT,
  PORN_PREDICTION,
  PRIVATE_CHAT_TYPE,
  TEMP_CHAT_PREFIX,
  TEXT_MESSAGE_TYPE,
} from "@/helpers/constants";
import { formatter } from "@/helpers/helpers";
import service from "@/service/service";
import { socket } from "@/socket.io/socket";
import { LoadingOutlined, SendOutlined } from "@ant-design/icons";
import emojiData from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import { Image } from "antd";
import TextArea from "antd/es/input/TextArea";
import { XCircle, Image as ImageIcon } from "lucide-react";
import React, { useEffect, useState } from "react";
import { BsEmojiNeutral } from "react-icons/bs";
import TimeAgo from "react-timeago";
import { toast } from "sonner";
import * as tf from "@tensorflow/tfjs";
import { useMediaQuery } from "react-responsive";
import { useQuery } from "@tanstack/react-query";
import { defaultErrorQueryClient } from "@/helpers/queryClient";

export function MessagingArea({ model }: any) {
  const { user } = React.useContext<any>(AuthContext);
  const { currentlyJoinedRoom } = React.useContext<any>(CurrentRoomContext);

  const messageContainerRef = React.useRef<any>();
  const [messages, setMessages] = useState<any>([]);

  const [currentInput, setCurrentInput] = useState("");

  const [chatName, setChatName] = React.useState<string>("");
  const [usersMap, setUsersMap] = React.useState<Map<string, any>>();

  // const [initLoading, setInitLoading] = useState(false);

  const [loading, setLoading] = useState(false);
  const [noMoreData, setNoMoreData] = useState(false);
  const messageQuerySize = 20;

  const [initNewChat, setInitNewChat] = useState(false);

  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);

  const messageInputRef = React.useRef<any>();
  const [images, setImages] = useState<any>([]);
  const predictionThreshold = 0.7;

  const isDesktopOrLaptop = useMediaQuery({
    query: "(min-width: 1224px)",
  });

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

  const fetchMessages = async () => {
    const response = await service.get(
      `/chats/messages/${currentlyJoinedRoom._id}`,
      {
        params: {
          o: 0,
          l: messageQuerySize,
        },
      }
    );
    setMessages(response.data.results);
    if (response.data.results.length < messageQuerySize) {
      setNoMoreData(true);
    }
    return response.data.results;
  };

  // Use the useQuery hook
  const { isLoading } = useQuery(
    {
      queryKey: ["messages", currentlyJoinedRoom._id],
      queryFn: fetchMessages,
    },
    defaultErrorQueryClient
  );

  const sendMessage = () => {
    if (!currentInput && !images.length) {
      toast("Please enter a message");
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

  const assessImage = async (image: any) => {
    if (model !== null) {
      const img = new window.Image();
      img.src = URL.createObjectURL(image);
      await new Promise((resolve) => {
        img.onload = resolve;
      });
      // Convert the image to a tensor
      const imageTensor = tf.browser.fromPixels(img);

      // Classify the image
      const prediction = await model.classify(imageTensor);
      tf.dispose(imageTensor);

      // revoke the object URL after the image has been loaded and processed
      URL.revokeObjectURL(img.src);

      return prediction;
    }
  };

  useEffect(() => {
    document.getElementById("messageInput")?.addEventListener("paste", (e) => {
      if (e.clipboardData?.files?.length) {
        e.preventDefault();
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
    if (!images.length) return;
    assessImage(images[images.length - 1]).then((prediction) => {
      console.log("prediction >>>", prediction);
      if (
        (prediction[0].className === HENTAI_PREDICTION ||
          prediction[0].className === PORN_PREDICTION) &&
        prediction[0].probability > predictionThreshold
      ) {
        toast("NSFW content detected");
        setImages((prev: any) => prev.slice(0, -1));
        return;
      }
    });
  }, [images]);

  return (
    <>
      <div className="text-center font-bold text-2xl mb-3">{chatName}</div>
      <div
        ref={messageContainerRef}
        id="messageContainer"
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
        onDrop={(e) => {
          e.preventDefault();
          console.log(e.dataTransfer.files[0].type);
          if (
            e.dataTransfer.files[0].type.startsWith("image/jpeg") ||
            e.dataTransfer.files[0].type.startsWith("image/png")
          ) {
            setImages((prev: any) => [...prev, e.dataTransfer.files[0]]);
          }
        }}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => messageInputRef.current?.focus()}
      >
        <div className="flex flex-col-reverse gap-1 flex-1">
          {isLoading ? (
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
                    } ${
                  message.type === IMAGE_MESSAGE_TYPE && "bg-transparent"
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
                    <Image
                      src={message.content}
                      className="max-w-[20rem] max-h-[20rem] object-cover"
                    />
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
      <div
        className="flex gap-2 items-end pr-3"
        onDrop={(e) => {
          e.preventDefault();
          if (e.dataTransfer.files[0].type.startsWith("image")) {
            setImages((prev: any) => [...prev, e.dataTransfer.files[0]]);
          }
        }}
        onDragOver={(e) => e.preventDefault()}
      >
        <label
          className="py-2 px-1 relative text-2xl cursor-pointer hover:text-[#6899d9] transition-all duration-100"
          htmlFor="imageInput"
        >
          <ImageIcon size={30} />
        </label>
        <input
          id="imageInput"
          type="file"
          className="hidden"
          multiple
          accept=".jpg, .jpeg, .png"
          onChange={(e) => {
            setImages((prev: any) => [...prev, ...e.target.files]);
          }}
        />
        <div className="flex-1 relative">
          {images.length > 0 && (
            <div className="overflow-x-auto p-2 flex pb-0 bg-gray-700 rounded-t-[4px] gap-2 w-full">
              {images.map((image: any, index: number) => (
                <div className="flex-shrink-0 relative" key={index}>
                  <Image
                    src={URL.createObjectURL(image)}
                    key={index}
                    width={"8rem"}
                    height={"8rem"}
                    className="object-center object-cover"
                  />
                  <div
                    className="absolute right-0 top-0 cursor-pointer"
                    onClick={() =>
                      setImages((prev: any) =>
                        prev.filter((item: any) => item !== image)
                      )
                    }
                  >
                    <XCircle />
                  </div>
                </div>
              ))}
            </div>
          )}
          <TextArea
            ref={messageInputRef}
            id="messageInput"
            className={`w-full bg-gray-700 p-2 text-lg m-0 ${
              images.length > 0 && "rounded-t-none"
            }`}
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
        </div>
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
            <div className="absolute top-0 right-0 translate-x-1 -translate-y-full">
              <Picker
                data={emojiData}
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
                perLine={isDesktopOrLaptop ? 9 : 7}
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
