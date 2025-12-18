import AuthContext from "@/contexts/AuthContext";
import CurrentRoomContext from "@/contexts/CurrentRoomContext";
import IncomingCallContext from "@/contexts/IncomingCallContext";
import PeerContext from "@/contexts/PeerContext";
import Loading from "@/helpers/Loading";
import { JOINED_EVENT } from "@/helpers/constants";
import service from "@/service/service";
import { socket } from "@/socket.io/socket";
import { MenuOutlined } from "@ant-design/icons";
import * as tf from "@tensorflow/tfjs";
import * as nsfwjs from "nsfwjs";
import { MediaConnection, Peer } from "peerjs";
import { useContext, useEffect, useState } from "react";
import Drawer from "react-modern-drawer";
import "react-modern-drawer/dist/index.css";
import { useMediaQuery } from "react-responsive";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import CallPopup from "../Call/CallPopup";
import { MessagingArea } from "./MessagingArea";
import Sidebar from "./Sidebar";

export default function Messaging() {
  const { user, setUser } = useContext<any>(AuthContext);
  const { peer, setPeer } = useContext<{
    peer: Peer | undefined;
    setPeer: any;
  }>(PeerContext);

  const navigate = useNavigate();

  const { currentlyJoinedRoom } = useContext(CurrentRoomContext);

  const [sidebarOpen, setSidebarOpen] = useState<any>(false);

  const [model, setModel] = useState<any>();

  const [loading, setLoading] = useState<boolean>(false);

  const [incomingCallCaller, setIncomingCallCaller] = useState<any>({
    name: "",
    avatar: "",
  });

  const { incomingCall, setIncomingCall } = useContext<{
    incomingCall: MediaConnection;
    setIncomingCall: any;
  }>(IncomingCallContext);

  const loadModel = async () => {
    try {
      const model = await nsfwjs.load();
      setModel(model);
      setLoading(false);
    } catch (error) {
      console.log(error);
      toast("Failed to load nsfw model");
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!socket.connected) {
      socket.connect();
    }

    return () => {
      socket.disconnect();
      peer?.disconnect();
    };
  }, []);

  useEffect(() => {
    if (model) {
      return;
    }
    setLoading(true);
    tf.ready().then(() => {
      loadModel();
    });
  }, []);

  useEffect(() => {
    if (!user) {
      service.get("/users/me").then((res) => {
        setUser(res.data.results);

        setPeer(new Peer(res.data.results._id));
      });
    }
  }, []);

  useEffect(() => {
    if (!peer) return;

    peer.on("call", (call) => {
      service.get(`/users/${call.peer}`).then((res) => {
        setIncomingCallCaller({
          name: res.data.results.fullName,
          avatar: res.data.results.avatar,
        });
      });

      setIncomingCall(call);
    });

    peer.on("error", (err) => {
      switch (err.type) {
        case "browser-incompatible":
          toast("Your browser is not compatible with our call service.");
          break;
        case "peer-unavailable":
          toast("The user is not available.");
          setTimeout(() => {
            navigate("/");
          }, 2000);
          break;
        default:
          break;
      }
    });
  }, [peer]);

  const onAccept = () => {
    navigate(`/call/${incomingCall.peer}?isCaller=${false}`);
  };

  const onReject = () => {
    incomingCall.close();
    setIncomingCall(undefined);
  };

  useEffect(() => {
    if (!user) return;

    socket.emit("self", user._id);

    return () => {
      socket.off(JOINED_EVENT);
    };
  }, [user]);

  const isDesktopOrLaptop = useMediaQuery({
    query: "(min-width: 1224px)",
  });

  useEffect(() => {
    setSidebarOpen(isDesktopOrLaptop);
  }, [isDesktopOrLaptop]);

  return (
    <div className="flex h-screen w-screen overflow-auto bg-mainBackground text-white">
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
      <div className="relative flex flex-1 flex-col p-3 pr-0">
        {!isDesktopOrLaptop && (
          <div
            className="absolute left-0 top-0 cursor-pointer p-3 text-xl"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <MenuOutlined />
          </div>
        )}
        {currentlyJoinedRoom && <MessagingArea model={model} />}
      </div>
      {incomingCall && (
        <CallPopup
          caller={incomingCallCaller}
          onAccept={onAccept}
          onReject={onReject}
        />
      )}
    </div>
  );
}
