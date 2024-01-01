import AuthContext from "@/contexts/AuthContext";
import service from "@/service/service";
import { socket } from "@/socket.io/socket";
import { SendOutlined } from "@ant-design/icons";
import TextArea from "antd/es/input/TextArea";
import { useContext, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { MessageContainer } from "./MessageContainer";

export default function Messaging() {
  const { user, setUser } = useContext<any>(AuthContext);

  const textAreaRef = useRef<any>();

  const [messages, setMessages] = useState<any>([]);

  const [currentInput, setCurrentInput] = useState("");

  useEffect(() => {
    if (!user) {
      service.get("/users/me").then((res) => {
        setUser(res.data.results);
      });
    }
  }, []);

  useEffect(() => {
    if (!socket.connected) {
      socket.connect();
    }

    socket.on("message", (data) => {
      setMessages((prev: any) => [...prev, data]);
    });

    return () => {
      socket.off("message");
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    textAreaRef.current.scrollTop = textAreaRef.current.scrollHeight;
  }, [currentInput]);

  const sendMessage = () => {
    if (!currentInput) {
      toast("Please enter a message", { position: "top-center" });
      return;
    }
    socket.emit("message", {
      content: currentInput,
      timestamp: Date.now(),
      sender: user,
    });
    setCurrentInput("");
  };

  return (
    <div className="w-full h-screen bg-[#1e1e23] text-white flex gap-3">
      <div className="basis-[30%] border border-gray-700 rounded-lg p-3">
        Sidebar
      </div>
      <div className="basis-[70%] p-3 flex flex-col">
        <div className="text-center font-bold text-2xl mb-3">
          Public Channel
        </div>
        <MessageContainer messages={messages} />
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
      </div>
    </div>
  );
}
