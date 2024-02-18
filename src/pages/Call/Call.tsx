import AuthContext from "@/contexts/AuthContext";
import InCallContext from "@/contexts/InCallContext";
import IncomingCallContext from "@/contexts/IncomingCallContext";
import PeerContext from "@/contexts/PeerContext";
import { MediaConnection, Peer } from "peerjs";
import { useContext, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

export default function Call() {
  const { inCall, setInCall } = useContext(InCallContext);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [searchParams, _setSearchParams] = useSearchParams();

  const { user } = useContext(AuthContext);

  const { incomingCall, setIncomingCall } = useContext<{
    incomingCall: MediaConnection;
    setIncomingCall: any;
  }>(IncomingCallContext);

  const { peer } = useContext<{
    peer: Peer | undefined;
    setPeer: any;
  }>(PeerContext);

  useEffect(() => {
    return () => {
      setInCall(false);
    };
  }, []);

  const urlParams = useParams();

  const startCall = async () => {
    const callTo = urlParams.id;

    if (callTo === user?.id || callTo === undefined) {
      toast("Bad call request");
      return;
    }

    const media = await navigator.mediaDevices.getUserMedia({
      // video: true,
      audio: true,
    });

    peer?.call(callTo, media);

    // set video element to user webcam
    (document.getElementById("selfVideo")! as HTMLVideoElement).srcObject =
      media;
  };

  const joinCall = async () => {
    if (!incomingCall) {
      toast("No incoming call");
      return;
    }

    setIncomingCall(undefined);

    const media = await navigator.mediaDevices.getUserMedia({
      // video: true,
      audio: true,
    });

    incomingCall.answer(media);

    // set video element to user webcam
    (document.getElementById("selfVideo")! as HTMLVideoElement).srcObject =
      media;
  };

  useEffect(() => {
    if (inCall) {
      toast("You are already in a call!");
      return;
    }

    setInCall(true);

    const isCaller = searchParams.get("isCaller");

    if (isCaller) {
      startCall();
    } else {
      joinCall();
    }
  }, []);

  return (
    <div className="h-screen w-full bg-mainBackground">
      <div className="text-3xl font-bold text-white">Call</div>
      <div className="flex w-full">
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
