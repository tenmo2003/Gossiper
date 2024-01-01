import AuthContext from "@/contexts/AuthContext";
import service from "@/service/service";
import { socket } from "@/socket.io/socket";
import { Button, Input } from "antd";
import moment from "moment";
import { useContext, useEffect, useState } from "react";

export default function Messaging() {
  const { user, setUser } = useContext<any>(AuthContext);

  useEffect(() => {
    if (!user) {
      service.get("/users/me").then((res) => {
        setUser(res.data.results);
      });
    }
  }, []);

  const [messages, setMessages] = useState<any>([]);

  const [currentInput, setCurrentInput] = useState("");

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

  const sendMessage = () => {
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
        <div className="flex flex-col gap-3 flex-1 overflow-auto">
          {messages.map((message: any, index: number) => (
            <div
              className={`border border-gray-700 p-2 text-white rounded-lg
                  ${
                    message.sender.username === user.username
                      ? "self-end"
                      : "self-start"
                  }`}
              key={index}
            >
              <div>
                {message.sender.fullName} -{" "}
                {moment(message.timestamp).fromNow()}
              </div>
              <div>
                <span>{message.content}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            className="bg-gray-700 p-2 w-full text-base"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                sendMessage();
              }
            }}
            onChange={(e) => {
              setCurrentInput(e.target.value);
            }}
            value={currentInput}
          />
          <Button
            type={"primary"}
            className="hover:bg-[#A5C9CA] text-base h-full"
            onClick={sendMessage}
          >
            Send
          </Button>
        </div>
      </div>
    </div>
  );
}
