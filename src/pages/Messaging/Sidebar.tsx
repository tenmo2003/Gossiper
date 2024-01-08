import AuthContext from "@/contexts/AuthContext";
import {
  JOINED_EVENT,
  JOIN_BY_USERS_EVENT,
  PRIVATE_CHAT_TYPE,
  ROOM_UPDATE_EVENT,
} from "@/helpers/constants";
import service from "@/service/service";
import { socket } from "@/socket.io/socket";
import { LoadingOutlined } from "@ant-design/icons";
import { AutoComplete, Divider } from "antd";
import { Search } from "lucide-react";
import { useContext, useEffect, useState } from "react";
import ChatRoom from "./ChatRoom";
import CurrentRoomContext from "@/contexts/CurrentRoomContext";

export default function Sidebar() {
  const { user } = useContext<any>(AuthContext);

  const { setCurrentlyJoinedRoom } = useContext<any>(CurrentRoomContext);

  const [userQuery, setUserQuery] = useState("");
  const [userQueryResults, setUserQueryResults] = useState<any>([]);

  const userQuerySize = 10;
  const [noMoreUsers, setNoMoreUsers] = useState(false);
  const [userQueryLoading, setUserQueryLoading] = useState(false);
  const [queried, setQueried] = useState(false);

  const [chatRooms, setChatRooms] = useState<any>(null);

  const chatQuerySize = 15;
  const [chatsLoading, setChatsLoading] = useState(true);
  const [noMoreChats, setNoMoreChats] = useState(false);

  useEffect(() => {
    if (!user) return;

    if (!chatRooms) {
      setChatsLoading(true);
      service
        .get("/chats/rooms", {
          params: {
            o: 0,
            l: chatQuerySize,
          },
        })
        .then((res) => {
          setChatRooms(res.data.results);
          setChatsLoading(false);
          if (res.data.results.length < chatQuerySize) {
            setNoMoreChats(true);
          }
        })
        .catch(() => {
          setChatsLoading(false);
        });
    }

    socket.on(JOINED_EVENT, (data: any) => {
      if (data.tmpWith) {
        setCurrentlyJoinedRoom({
          ...data,
        });
      } else {
        setCurrentlyJoinedRoom(
          chatRooms.find((item: any) => item._id === data._id)
        );
      }
    });

    socket.on(ROOM_UPDATE_EVENT, (data) => {
      if (chatRooms.find((item: any) => item._id === data._id)) {
        //put it on top
        const newChatRooms = chatRooms.filter(
          (item: any) => item._id !== data._id
        );
        newChatRooms.unshift(data);
        setChatRooms(newChatRooms);
        return;
      }
      setChatRooms((prev: any) => [data, ...prev]);
    });

    return () => {
      socket.off(ROOM_UPDATE_EVENT);
      socket.off(JOINED_EVENT);
    };
  }, [user, chatRooms]);

  useEffect(() => {
    if (!userQuery) {
      setUserQueryResults([]);
      return;
    }

    const timer = setTimeout(() => {
      setNoMoreUsers(false);
      setUserQueryLoading(true);
      service
        .get(`/users`, {
          params: {
            q: userQuery,
            o: 0,
            l: userQuerySize,
          },
        })
        .then((res) => {
          setUserQueryLoading(false);
          const newResults = res.data.results.filter(
            (item: any) => item._id !== user?._id
          );
          setUserQueryResults([...newResults]);
          if (newResults.length < userQuerySize) {
            setNoMoreUsers(true);
          }
          setQueried(true);
        })
        .catch(() => {
          setUserQueryLoading(false);
        });
    }, 200);

    return () => {
      setQueried(false);
      clearTimeout(timer);
    };
  }, [userQuery]);

  const fetchMoreData = () => {
    setUserQueryLoading(true);
    service
      .get(`/users`, {
        params: {
          q: userQuery,
          o: userQueryResults.length,
          l: userQuerySize,
        },
      })
      .then((res) => {
        setUserQueryLoading(false);
        const newResults = res.data.results.filter(
          (item: any) => item._id !== user?._id
        );
        setUserQueryResults((userQueryResults: any) => [
          ...userQueryResults,
          ...newResults,
        ]);
        if (newResults.length < userQuerySize) {
          setNoMoreUsers(true);
        }
      })
      .catch(() => {
        setUserQueryLoading(false);
      });
  };

  const fetchMoreChats = () => {
    setChatsLoading(true);
    service
      .get("/chats/rooms", {
        params: {
          o: chatRooms.length,
          l: chatQuerySize,
        },
      })
      .then((res) => {
        setChatsLoading(false);
        const newResults = res.data.results;
        setChatRooms((chatRooms: any) => [...chatRooms, ...newResults]);
        if (newResults.length < userQuerySize) {
          setNoMoreChats(true);
        }
      })
      .catch(() => {
        setChatsLoading(false);
      });
  };

  const joinPrivateRoom = (other: any) => {
    socket.emit(JOIN_BY_USERS_EVENT, {
      type: PRIVATE_CHAT_TYPE,
      users: [user, other],
    });
  };

  return (
    <div className="w-[30rem] border-r border-gray-700 pt-3 h-full flex flex-col">
      <div className="px-3">
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
                onClick={() => {
                  setUserQuery("");
                  joinPrivateRoom(user);
                }}
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
            (userQueryLoading || !queried ? null : (
              <div className="text-center">No results found</div>
            ))
          }
          onPopupScroll={(e: any) => {
            if (shouldFetchMoreData(e)) fetchMoreData();
          }}
          suffixIcon={
            userQueryLoading ? (
              <LoadingOutlined spin size={16} className="text-white" />
            ) : (
              <Search size={16} className="text-white" />
            )
          }
        />
      </div>
      <Divider type="horizontal" orientation="left" className="text-3xl px-3">
        <span className="text-2xl">Chats</span>
      </Divider>

      <div
        className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden"
        onScroll={(e: any) => {
          if (shouldFetchMoreChats(e)) fetchMoreChats();
        }}
      >
        {chatRooms &&
          chatRooms.map((chatRoom: any) => (
            <ChatRoom key={chatRoom._id} room={chatRoom} user={user} />
          ))}
        {chatsLoading && (
          <div className="text-3xl text-center">
            <LoadingOutlined spin />
          </div>
        )}
      </div>
    </div>
  );

  function shouldFetchMoreData(e: any) {
    // already operating
    if (userQueryLoading) return false;

    if (noMoreUsers) return false;

    // not at bottom of scroll
    if (
      !e.target.scrollTop + e.target.clientHeight >=
      e.target.scrollHeight - 1
    )
      return false;

    return true;
  }

  function shouldFetchMoreChats(e: any) {
    // already operating
    if (chatsLoading) return false;

    if (noMoreChats) return false;

    // not at bottom of scroll
    if (
      !e.target.scrollTop + e.target.clientHeight >=
      e.target.scrollHeight - 1
    )
      return false;

    return true;
  }
}
