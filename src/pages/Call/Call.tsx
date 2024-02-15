import InCallContext from "@/contexts/InCallContext";
import IsCallerContext from "@/contexts/IsCallerContext";
import { useContext, useEffect } from "react";
import { useParams } from "react-router-dom";
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
      // video: true,
      audio: true,
    });

    // set video element to user webcam
    (document.getElementById("selfVideo")! as HTMLVideoElement).srcObject =
      media;
  };

  const joinCall = async () => {
    if (inCall) {
      toast("You are already in a call!");
      return;
    }

    const media = await navigator.mediaDevices.getUserMedia({
      // video: true,
      audio: true,
    });

    // set video element to user webcam
    (document.getElementById("selfVideo")! as HTMLVideoElement).srcObject =
      media;
  };

  useEffect(() => {
    if (isCaller) {
      startCall();
    } else {
      joinCall();
    }
  }, []);

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
