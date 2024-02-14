import AuthContext from "@/contexts/AuthContext";
import CurrentRoomContext from "@/contexts/CurrentRoomContext";
import { JOINED_EVENT } from "@/helpers/constants";
import service from "@/service/service";
import { socket } from "@/socket.io/socket";
import { useContext, useEffect, useState } from "react";
import { MessagingArea } from "./MessagingArea";
import Sidebar from "./Sidebar";
import { useMediaQuery } from "react-responsive";
import { MenuOutlined } from "@ant-design/icons";
import Drawer from "react-modern-drawer";
import "react-modern-drawer/dist/index.css";
import * as nsfwjs from "nsfwjs";
import * as tf from "@tensorflow/tfjs";
import Loading from "@/helpers/Loading";

export default function Messaging() {
  const { user, setUser } = useContext<any>(AuthContext);

  const { currentlyJoinedRoom } = useContext(CurrentRoomContext);

  const [sidebarOpen, setSidebarOpen] = useState<any>(false);

  const [model, setModel] = useState<any>(null);

  const [loading, setLoading] = useState<boolean>(false);

  const loadModel = async () => {
    const model = await nsfwjs.load();
    setModel(model);
    setLoading(false);
  };

  useEffect(() => {
    if (!user) {
      service.get("/users/me").then((res) => {
        setUser(res.data.results);
      });
    }
    setLoading(true);
    tf.ready().then(() => {
      loadModel();
    });
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

  const isDesktopOrLaptop = useMediaQuery({
    query: "(min-width: 1224px)",
  });

  useEffect(() => {
    setSidebarOpen(isDesktopOrLaptop);
  }, [isDesktopOrLaptop]);

  return (
    <div className="w-screen h-screen bg-mainBackground text-white flex overflow-auto">
      {loading && <Loading />}
      {isDesktopOrLaptop ? (
        <div className="w-[30rem] flex-shrink-0">
          <Sidebar />
        </div>
      ) : (
        <Drawer
          direction="left"
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          style={{ width: "25rem", maxWidth: "80%" }}
        >
          <Sidebar setSidebarOpen={setSidebarOpen} />
        </Drawer>
      )}
      <div className="flex-1 p-3 pr-0 flex flex-col relative">
        {!isDesktopOrLaptop && (
          <div
            className="absolute top-0 left-0 p-3 text-xl cursor-pointer"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <MenuOutlined />
          </div>
        )}
        {currentlyJoinedRoom && <MessagingArea model={model} />}
      </div>
    </div>
  );
}
