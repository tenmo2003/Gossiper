import AuthContext from "@/contexts/AuthContext";
import { PRIVATE_CHAT_TYPE } from "@/helpers/constants";
import service from "@/service/service";
import { socket } from "@/socket.io/socket";
import { LoadingOutlined } from "@ant-design/icons";
import { AutoComplete, Divider } from "antd";
import { Search } from "lucide-react";
import { useContext, useEffect, useState } from "react";
import ChatRoom from "./ChatRoom";

export default function Sidebar() {
  const { user } = useContext<any>(AuthContext);

  const querySize = 10;
  const [userQuery, setUserQuery] = useState("");
  const [userQueryResults, setUserQueryResults] = useState<any>([]);

  const [noMoreData, setNoMoreData] = useState(false);
  const [queryLoading, setQueryLoading] = useState(false);

  const [queried, setQueried] = useState(false);

  const [chatRooms, setChatRooms] = useState<any>([]);

  useEffect(() => {
    service
      .get("/chats/rooms", {
        params: {
          o: 0,
          l: querySize,
        },
      })
      .then((res) => {
        setChatRooms(res.data.results);
      });
  }, []);

  useEffect(() => {
    if (!userQuery) {
      setUserQueryResults([]);
      return;
    }

    const timer = setTimeout(() => {
      setNoMoreData(false);
      setQueryLoading(true);
      service
        .get(`/users`, {
          params: {
            q: userQuery,
            o: 0,
            l: querySize,
          },
        })
        .then((res) => {
          setQueryLoading(false);
          const newResults = res.data.results.filter(
            (item: any) => item._id !== user?._id
          );
          setUserQueryResults([...newResults]);
          if (newResults.length < querySize) {
            setNoMoreData(true);
          }
          setQueried(true);
        })
        .catch(() => {
          setQueryLoading(false);
        });
    }, 200);

    return () => {
      setQueried(false);
      clearTimeout(timer);
    };
  }, [userQuery]);

  const fetchMoreData = () => {
    setQueryLoading(true);
    service
      .get(`/users`, {
        params: {
          q: userQuery,
          o: userQueryResults.length,
          l: querySize,
        },
      })
      .then((res) => {
        setQueryLoading(false);
        const newResults = res.data.results.filter(
          (item: any) => item._id !== user?._id
        );
        setUserQueryResults((userQueryResults: any) => [
          ...userQueryResults,
          ...newResults,
        ]);
        if (newResults.length < querySize) {
          setNoMoreData(true);
        }
      })
      .catch(() => {
        setQueryLoading(false);
      });
  };

  const joinPrivateRoom = (id: string) => {
    socket.emit("joinByUsers", {
      type: PRIVATE_CHAT_TYPE,
      users: [user?._id, id],
    });
  };

  return (
    <div className="w-[30rem] border-r border-gray-700 p-3">
      <AutoComplete
        className="w-[100%]"
        value={userQuery}
        onSearch={(value) => {
          if (value.charAt(Math.max(value.length - 1, 0)) === "\\") return;
          setUserQuery(value.trimStart());
        }}
        options={userQueryResults.map((user: any) => ({
          value: user._id,
          label: (
            <div
              onClick={() => joinPrivateRoom(user._id)}
              className="flex flex-col"
            >
              <span>{user.fullName}</span>
              <span className="text-xs text-[#c7c7c7]">@{user.username}</span>
            </div>
          ),
        }))}
        placeholder="Search for user"
        notFoundContent={
          userQuery.length > 0 &&
          (queryLoading || !queried ? null : (
            <div className="text-center">No results found</div>
          ))
        }
        onPopupScroll={(e: any) => {
          if (shouldFetchMoreData(e)) fetchMoreData();
        }}
        suffixIcon={
          queryLoading ? (
            <LoadingOutlined spin size={16} className="text-white" />
          ) : (
            <Search size={16} className="text-white" />
          )
        }
      />
      <Divider type="horizontal" orientation="left" className="text-3xl">
        <span className="text-2xl">Chats</span>
      </Divider>
      <div className="flex flex-col gap-3">
        {chatRooms.map((chatRoom: any) => (
          <ChatRoom key={chatRoom._id} room={chatRoom} user={user} />
        ))}
      </div>
    </div>
  );

  function shouldFetchMoreData(e: any) {
    // already operating
    if (queryLoading) return false;

    if (noMoreData) return false;

    // not at bottom of scroll
    if (
      !e.target.scrollTop + e.target.clientHeight >=
      e.target.scrollHeight - 1
    )
      return false;

    return true;
  }
}
