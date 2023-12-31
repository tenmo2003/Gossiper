import { useEffect, useState } from "react";
import { Button } from "./components/ui/button";
import { Input } from "./components/ui/input";
import moment from "moment";
import { ScrollArea } from "./components/ui/scroll-area";
import { socket } from "./socket.io/socket";

function App() {
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
    socket.emit("message", { content: currentInput, timestamp: Date.now() });
    setCurrentInput("");
  };

  return (
    <div className="h-screen w-full flex items-center justify-center bg-[#2c3333]">
      <div className="w-1/2 h-3/4 bg-[#1e1e23] text-white flex rounded-xl p-3 gap-3">
        <div className="basis-[30%] border border-gray-700 rounded-lg p-3">
          Sidebar
        </div>
        <div className="basis-[70%] p-3 flex flex-col">
          <div className="text-center font-bold text-2xl mb-3">
            Public Channel
          </div>
          <ScrollArea className="flex-1">
            <div className="flex flex-col gap-3">
              {messages.map((message: any, index: number) => (
                <div
                  className={
                    "border border-gray-700 p-2 text-white rounded-lg" +
                      socket.id ===
                    message.sender
                      ? "self-end"
                      : "self-start"
                  }
                  key={index}
                >
                  <div>
                    {message.sender} - {moment(message.timestamp).fromNow()}
                  </div>
                  <div>
                    <span>{message.content}</span>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
          <div className="flex gap-3">
            <div className="border border-gray-700 rounded-lg flex-1">
              <Input
                className="bg-gray-700 p-2 w-full rounded-lg text-base"
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
            </div>
            <Button
              variant={"default"}
              className="bg-[#395B64] hover:bg-[#A5C9CA] text-base"
              onClick={sendMessage}
            >
              Send
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
