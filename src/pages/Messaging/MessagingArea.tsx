import AuthContext from "@/contexts/AuthContext";
import CurrentRoomContext from "@/contexts/CurrentRoomContext";
import {
  HENTAI_PREDICTION,
  MESSAGE_EVENT,
  PORN_PREDICTION,
  PRIVATE_CHAT_TYPE,
  TEMP_CHAT_PREFIX,
} from "@/helpers/constants";
import { getOtherUserId } from "@/helpers/helpers";
import { getDefaultErrorQueryClient } from "@/helpers/queryClient";
import service from "@/service/service";
import { socket } from "@/socket.io/socket";
import { SendOutlined } from "@ant-design/icons";
import emojiData from "@emoji-mart/data";
import Picker from "@emoji-mart/react";
import { useQuery } from "@tanstack/react-query";
import * as tf from "@tensorflow/tfjs";
import { Image } from "antd";
import TextArea from "antd/es/input/TextArea";
import { PhoneCall, XCircle } from "lucide-react";
import React, { useEffect, useState } from "react";
import { BsEmojiNeutral } from "react-icons/bs";
import { useMediaQuery } from "react-responsive";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import ImagePicker from "./Components/ImagePicker";
import Messages from "./Components/Messages";

export function MessagingArea({ model }: any) {
  const { user } = React.useContext<any>(AuthContext);
  const { currentlyJoinedRoom } = React.useContext<any>(CurrentRoomContext);

  const messageContainerRef = React.useRef<any>();
  const [messages, setMessages] = useState<any>([]);

  const [currentInput, setCurrentInput] = useState("");

  const [chatName, setChatName] = React.useState<string>("");
  const [usersMap, setUsersMap] = React.useState<Map<string, any>>();

  // const [initLoading, setInitLoading] = useState(false);

  const navigate = useNavigate();

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
        : currentlyJoinedRoom.groupName,
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

  const [initLoading, setInitLoading] = useState(false);

  const fetchMessages = async () => {
    if (currentlyJoinedRoom._id.startsWith(TEMP_CHAT_PREFIX)) {
      return [];
    }

    setInitLoading(true);
    const response = await service.get(
      `/chats/messages/${currentlyJoinedRoom._id}`,
      {
        params: {
          o: 0,
          l: messageQuerySize,
        },
      },
    );
    setMessages(response.data.results);
    if (response.data.results.length < messageQuerySize) {
      setNoMoreData(true);
    }
    setInitLoading(false);
    return response.data.results;
  };

  // Use the useQuery hook
  useQuery(
    {
      queryKey: ["messages", currentlyJoinedRoom._id],
      queryFn: fetchMessages,
    },
    getDefaultErrorQueryClient(() => setInitLoading(false)),
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
    if (!currentlyJoinedRoom.tmpWith) {
      document
        .getElementById("messageInput")
        ?.addEventListener("paste", (e) => {
          if (e.clipboardData?.files?.length) {
            e.preventDefault();
            setImages((prev: any) => [...prev, ...e.clipboardData.files]);
            return;
          }
        });
    }

    return () => {
      document
        .getElementById("messageInput")
        ?.removeEventListener("paste", () => {});
    };
  }, [currentlyJoinedRoom]);

  const [justDetectedNSFW, setJustDetectedNSFW] = useState(false);

  useEffect(() => {
    if (!images.length) return;
    if (justDetectedNSFW) {
      setJustDetectedNSFW(false);
      return;
    }
    assessImage(images[images.length - 1]).then((prediction) => {
      console.log("prediction >>>", prediction);
      if (
        (prediction[0].className === HENTAI_PREDICTION ||
          prediction[0].className === PORN_PREDICTION) &&
        prediction[0].probability > predictionThreshold
      ) {
        toast("NSFW content detected");
        setJustDetectedNSFW(true);
        setImages((prev: any) => prev.slice(0, -1));
        return;
      }
    });
  }, [images]);

  return (
    <>
      <div className="relative">
        <div className="mb-3 text-center text-2xl font-bold">{chatName}</div>
        {!initNewChat && (
          <Link
            to={`/call/${getOtherUserId(user._id, currentlyJoinedRoom.users)}?isCaller=${true}`}
            state={{ isCaller: true }}
          >
            <PhoneCall className="absolute right-4 top-0 cursor-pointer hover:text-blue-400" />
          </Link>
        )}
      </div>
      <div
        ref={messageContainerRef}
        id="messageContainer"
        className="mb-2 flex flex-1 flex-col-reverse gap-1 overflow-auto px-2 py-1"
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
        <Messages
          data={messages}
          initLoading={initLoading}
          usersMap={usersMap}
          loading={loading}
        />
      </div>
      <div
        className="flex w-full items-end gap-2 pr-3"
        onDrop={(e) => {
          e.preventDefault();
          if (e.dataTransfer.files[0].type.startsWith("image")) {
            setImages((prev: any) => [...prev, e.dataTransfer.files[0]]);
          }
        }}
        onDragOver={(e) => e.preventDefault()}
      >
        {!currentlyJoinedRoom.tmpWith && <ImagePicker setImages={setImages} />}
        <div className="relative flex-1">
          {images.length > 0 && (
            <div className="flex gap-2 overflow-auto rounded-t-[4px] bg-gray-700 p-2 pb-0">
              {images.map((image: any, index: number) => (
                <div className="relative flex-shrink-0" key={index}>
                  <Image
                    src={URL.createObjectURL(image)}
                    key={index}
                    width={"8rem"}
                    height={"8rem"}
                    className="object-cover object-center"
                  />
                  <div
                    className="absolute right-0 top-0 cursor-pointer transition-colors duration-200 hover:text-red-400"
                    onClick={() =>
                      setImages((prev: any) =>
                        prev.filter((item: any) => item !== image),
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
            className={`m-0 w-full bg-gray-700 p-2 text-lg ${
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
        <div className="relative px-1 py-2">
          <div
            className="cursor-pointer transition-all duration-100 hover:text-[#6899d9]"
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
            <div className="absolute right-0 top-0 -translate-y-full translate-x-1">
              <Picker
                data={emojiData}
                onEmojiSelect={(emoji: any) => {
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
          className="cursor-pointer rounded-full bg-primary px-3 py-2 transition-all duration-100 hover:bg-[#6899d9]"
        >
          <SendOutlined />
        </div>
      </div>
    </>
  );
}
