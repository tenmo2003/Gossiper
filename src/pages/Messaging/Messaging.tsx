import AuthContext from "@/contexts/AuthContext";
import { JOINED_EVENT } from "@/helpers/constants";
import service from "@/service/service";
import { socket } from "@/socket.io/socket";
import { useContext, useEffect, useState } from "react";
import { MessagingArea } from "./MessagingArea";
import Sidebar from "./Sidebar";

export default function Messaging() {
  const { user, setUser } = useContext<any>(AuthContext);

  const [currentlyJoinedRoom, setCurrentlyJoinedRoom] = useState<any>();

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

    socket.emit("self", user._id);

    return () => {
      socket.off(JOINED_EVENT);
      socket.disconnect();
    };
  }, [user]);

  return (
    <div className="w-full h-screen bg-[#1e1e23] text-white flex overflow-hidden">
      <Sidebar setCurrentlyJoinedRoom={setCurrentlyJoinedRoom} />
      <div className="flex-1 p-3 flex flex-col">
        {currentlyJoinedRoom && <MessagingArea chat={currentlyJoinedRoom} />}
      </div>
    </div>
  );
}
