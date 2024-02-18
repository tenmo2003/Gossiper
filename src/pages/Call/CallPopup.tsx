import { Avatar } from "antd";
import { PhoneIncoming, PhoneOff } from "lucide-react";

export default function CallPopup({ caller, onAccept, onReject }: any) {
  return (
    <div className="fixed z-[1000] flex h-screen w-screen items-center justify-center bg-[#1a223286]">
      <div className="flex h-[20rem] w-[20rem] flex-col items-center justify-evenly gap-10 rounded-lg bg-[#1a2849] p-3">
        <div className="text-3xl font-bold">Call Incoming</div>
        <div className="text-xl">{caller.name}</div>
        <Avatar size={80} src={caller.avatar} />
        <div className="flex w-full justify-evenly">
          <div
            className="cursor-pointer rounded-full bg-green-500 p-3 hover:bg-green-400"
            onClick={onAccept}
          >
            <PhoneIncoming className="text-white" />
          </div>
          <div
            className="cursor-pointer rounded-full bg-red-500 p-3 hover:bg-red-400"
            onClick={onReject}
          >
            <PhoneOff className="text-white" />
          </div>
        </div>
      </div>
    </div>
  );
}
