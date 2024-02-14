import InCallContext from "@/contexts/InCallContext";
import IsCallerContext from "@/contexts/IsCallerContext";
import { socket } from "@/socket.io/socket";
import { useContext, useEffect } from "react";
import { useParams } from "react-router-dom";
import Peer from "simple-peer";
import { toast } from "sonner";

export default function Call() {
  const { inCall, setInCall } = useContext(InCallContext);
  const { isCaller } = useContext(IsCallerContext);

  const callTo = useParams().id;

  const startCall = async () => {
    if (inCall) {
      toast("You are already in a call!");
      return;
    }

    const media = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    const peer = new Peer({
      initiator: true,
      stream: media,
    });

    // set video element to user webcam
    (document.getElementById("selfVideo")! as HTMLVideoElement).srcObject =
      media;

    peer.on("signal", (data) => {
      socket.emit("signal", {
        to: callTo,
        data,
      });
    });

    peer.on("connect", () => {
      setInCall(true);
    });

    peer.on("stream", (stream) => {
      (document.getElementById("otherVideo")! as HTMLVideoElement).srcObject =
        stream;
    });

    socket.on("signal", (data) => {
      peer.signal(data);
    });
  };

  const joinCall = async () => {
    if (inCall) {
      toast("You are already in a call!");
      return;
    }

    const media = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    const peer = new Peer({
      initiator: false,
      stream: media,
    });

    // set video element to user webcam
    (document.getElementById("selfVideo")! as HTMLVideoElement).srcObject =
      media;

    peer.on("signal", (data) => {
      socket.emit("signal", {
        to: callTo,
        data,
      });
    });

    peer.on("connect", () => {
      setInCall(true);
    });

    peer.on("stream", (stream) => {
      (document.getElementById("otherVideo")! as HTMLVideoElement).srcObject =
        stream;
    });

    socket.on("signal", (data) => {
      peer.signal(data);
    });
  };

  useEffect(() => {
    if (isCaller) {
      startCall();
    } else {
      joinCall();
    }
  }, []);

  if (!Peer.WEBRTC_SUPPORT) {
    toast("WebRTC not supported!");
    return (
      <div className="w-full h-full flex items-center justify-center text-3xl font-bold">
        <h1>WebRTC not supported</h1>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-mainBackground">
      <div className="text-3xl font-bold text-white">Call</div>
      <div className="w-full flex">
        {/* user video */}
        <video
          className="flex-1 rounded-xl bg-white"
          id="selfVideo"
          autoPlay
          playsInline
          muted
        ></video>

        {/* other user video */}
        <video
          className="flex-1 rounded-xl"
          id="otherVideo"
          autoPlay
          playsInline
          muted
        ></video>
      </div>
    </div>
  );
}
