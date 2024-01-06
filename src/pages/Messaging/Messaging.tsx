import AuthContext from "@/contexts/AuthContext";
import service from "@/service/service";
import { socket } from "@/socket.io/socket";
import { SendOutlined } from "@ant-design/icons";
import TextArea from "antd/es/input/TextArea";
import { useContext, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { MessageContainer } from "./MessageContainer";
import Sidebar from "./Sidebar";
import {
  JOINED_EVENT,
  MESSAGE_EVENT,
  TEMP_CHAT_PREFIX,
} from "@/helpers/constants";

export default function Messaging() {
  const { user, setUser } = useContext<any>(AuthContext);

  const textAreaRef = useRef<any>();

  const [messages, setMessages] = useState<any>([]);

  const [currentInput, setCurrentInput] = useState("");

  const [currentlyJoinedRoom, setCurrentlyJoinedRoom] = useState<any>();

  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      service.get("/users/me").then((res) => {
        setUser(res.data.results);
      });
    }
  }, []);

  useEffect(() => {
    if (!user) return;

    if (!socket.connected) {
      socket.connect();
    }

    socket.on(MESSAGE_EVENT, (data) => {
      setMessages((prev: any) => [...prev, data]);
    });

    socket.emit("self", user._id);

    socket.on(JOINED_EVENT, setCurrentlyJoinedRoom);

    return () => {
      socket.off("message");
      socket.disconnect();
    };
  }, [user]);

  useEffect(() => {
    if (!textAreaRef.current) return;
    textAreaRef.current.scrollTop = textAreaRef.current.scrollHeight;
  }, [currentInput]);

  useEffect(() => {
    if (!currentlyJoinedRoom) return;

    if (currentlyJoinedRoom._id.startsWith(TEMP_CHAT_PREFIX)) {
      setMessages([]);
      return;
    }

    setLoading(true);
    service
      .get("/chats/messages/" + currentlyJoinedRoom._id, {
        params: {
          o: 0,
          l: 20,
        },
      })
      .then((res) => {
        setMessages(res.data.results);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [currentlyJoinedRoom]);

  const sendMessage = () => {
    if (!currentInput) {
      toast("Please enter a message", { position: "top-center" });
      return;
    }
    socket.emit(MESSAGE_EVENT, {
      newMessage: currentlyJoinedRoom._id?.startsWith(TEMP_CHAT_PREFIX),
      message: {
        content: currentInput,
        sender: user._id,
      },
      chatId: currentlyJoinedRoom._id,
    });
    setCurrentInput("");
  };

  return (
    <div className="w-full h-screen bg-[#1e1e23] text-white flex">
      <Sidebar />
      <div className="flex-1 p-3 flex flex-col">
        {currentlyJoinedRoom && (
          <>
            <MessageContainer
              chat={currentlyJoinedRoom}
              messages={messages}
              loading={loading}
            />
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
                  textAreaRef.current.scrollTop =
                    textAreaRef.current.scrollHeight;
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
        )}
      </div>
    </div>
  );
}
