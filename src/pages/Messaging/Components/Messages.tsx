import AuthContext from "@/contexts/AuthContext";
import React from "react";
import { LoadingOutlined } from "@ant-design/icons";
import { IMAGE_MESSAGE_TYPE, TEXT_MESSAGE_TYPE } from "@/helpers/constants";
import { formatter } from "@/helpers/helpers";
import TimeAgo from "react-timeago";
import { Image } from "antd";

export default function Messages({
  data,
  initLoading,
  loading,
  usersMap,
}: any) {
  const { user } = React.useContext<any>(AuthContext);

  return (
    <div className="flex flex-col-reverse gap-1 flex-1">
      {initLoading ? (
        <div className="w-full h-full flex items-center justify-center">
          <LoadingOutlined spin size={30} className="text-white text-3xl" />
        </div>
      ) : (
        data.map((message: any, index: number) => (
          <div
            className={`border border-gray-700 text-lg text-white rounded-lg max-w-[65%]
                    ${
                      message.sender === user._id
                        ? "self-end bg-primary"
                        : "self-start"
                    } ${
              message.type === IMAGE_MESSAGE_TYPE && "bg-transparent"
            }`}
            key={index}
            onClick={(e) => e.stopPropagation()}
          >
            {message.type === TEXT_MESSAGE_TYPE ? (
              <div className="p-2">
                {message.sender !== user._id && (
                  <span>
                    {usersMap?.get(message.sender)?.fullName} -{" "}
                    <TimeAgo date={message.createdAt} formatter={formatter} />
                  </span>
                )}
                <div>
                  <span
                    dangerouslySetInnerHTML={{
                      __html: message.content.replace(/\n/g, "<br/>"),
                    }}
                    className="break-words"
                  ></span>
                </div>
              </div>
            ) : (
              <div>
                <Image
                  src={message.content}
                  className="max-w-[20rem] max-h-[20rem] object-cover"
                />
              </div>
            )}
          </div>
        ))
      )}
      {loading && (
        <div className="w-full text-center text-3xl">
          <LoadingOutlined />
        </div>
      )}
    </div>
  );
}
