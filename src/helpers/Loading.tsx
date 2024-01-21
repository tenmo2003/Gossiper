import React from "react";
import { LoadingOutlined } from "@ant-design/icons";

export default function Loading() {
  return (
    <div className="w-full h-full absolute left-0 top-0 z-10 bg-[#141e30] flex items-center justify-center">
      <LoadingOutlined spin className="text-white text-5xl" />
    </div>
  );
}
