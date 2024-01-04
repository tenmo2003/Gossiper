import { AutoComplete, Input } from "antd";
import React, { useEffect, useState } from "react";
import { LoadingOutlined } from "@ant-design/icons";
import service from "@/service/service";
import { Search } from "lucide-react";

export default function Sidebar() {
  const querySize = 10;
  const [userQuery, setUserQuery] = useState("");
  const [userQueryResults, setUserQueryResults] = useState<any>([]);

  const [noMoreData, setNoMoreData] = useState(false);
  const [queryLoading, setQueryLoading] = useState(false);

  useEffect(() => {
    if (!userQuery) {
      setUserQueryResults([]);
      return;
    }

    setNoMoreData(false);
    setQueryLoading(true);
    service
      .get(`/users`, {
        params: { q: userQuery, o: 0, l: querySize },
      })
      .then((res) => {
        setQueryLoading(false);
        setUserQueryResults(res.data.results);
      });
  }, [userQuery]);

  return (
    <div className="w-[30rem] border-r border-gray-700 p-3">
      <AutoComplete
        className="w-[100%]"
        value={userQuery}
        onSearch={(value) => setUserQuery(value)}
        options={userQueryResults.map((user: any) => ({
          value: user.id,
          label: user.fullName,
        }))}
        placeholder="Search for user"
        notFoundContent={
          userQuery.length > 0 &&
          (queryLoading ? (
            <></>
          ) : (
            <div className="text-center">No results found</div>
          ))
        }
        onPopupScroll={(e: any) => {
          if (
            !noMoreData &&
            e.target.scrollTop + e.target.clientHeight === e.target.scrollHeight
          ) {
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
                const newResults = res.data.results;
                setUserQueryResults([...userQueryResults, ...newResults]);
                if (newResults.length < querySize) {
                  setNoMoreData(true);
                }
              });
          }
        }}
      >
        <Input
          suffix={
            queryLoading ? (
              <LoadingOutlined spin size={16} />
            ) : (
              <Search size={16} />
            )
          }
        />
      </AutoComplete>
    </div>
  );
}
