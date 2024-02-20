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
      video: true,
      audio: true,
    });

    const call = peer?.call(callTo, media);

    call?.on("close", () => {
      setInCall(false);

      toast("Call ended");

      setTimeout(() => {
        window.location.href = "/";
      }, 2000);
    });

    call?.on("stream", (stream) => {
      (document.getElementById("otherVideo")! as HTMLVideoElement).srcObject =
        stream;

      const audio: HTMLAudioElement = document.getElementById(
        "audio",
      ) as HTMLAudioElement;

      audio.srcObject = stream;

      audio.play();
    });

    // set video element to user webcam
    (document.getElementById("selfVideo")! as HTMLVideoElement).srcObject =
      media;
  };

  const joinCall = async () => {
    if (!incomingCall) {
      toast("No incoming call");
      return;
    }

    const media = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true,
    });

    incomingCall.answer(media);

    incomingCall.on("stream", (stream) => {
      (document.getElementById("otherVideo")! as HTMLVideoElement).srcObject =
        stream;

      const audio: HTMLAudioElement = document.getElementById(
        "audio",
      ) as HTMLAudioElement;

      audio.srcObject = stream;
    });

    incomingCall.on("close", () => {
      setInCall(false);

      toast("Call ended");

      setTimeout(() => {
        window.location.href = "/";
      }, 2000);

      setIncomingCall(undefined);
    });

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

    if (isCaller === "true") {
      startCall();
    } else {
      joinCall();
    }
  }, []);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-mainBackground">
      <div className="flex w-full gap-5 px-10">
        {/* user video */}
        <video
          className="flex-1 rounded-xl bg-slate-400"
          id="selfVideo"
          autoPlay
          playsInline
          muted
        ></video>

        {/* other user video */}
        <video
          className="flex-1 rounded-xl bg-slate-400"
          id="otherVideo"
          autoPlay
          playsInline
          muted
        ></video>
      </div>
      <audio id="audio" className="hidden" controls autoPlay></audio>
    </div>
  );
}
