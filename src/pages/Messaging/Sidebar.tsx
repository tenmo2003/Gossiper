import { AutoComplete } from "antd";
import React, { useEffect, useState } from "react";
import { LoadingOutlined } from "@ant-design/icons";
import service from "@/service/service";

export default function Sidebar() {
  const [userQuery, setUserQuery] = useState("");
  const [userQueryResults, setUserQueryResults] = useState<any>([]);

  const [queryLoading, setQueryLoading] = useState(false);

  useEffect(() => {
    if (!userQuery) {
      setUserQueryResults([]);
      return;
    }

    setQueryLoading(true);
    service
      .get(`/users`, {
        params: { q: userQuery, o: 0, l: 10 },
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
        onSearch={setUserQuery}
        options={userQueryResults.map((user: any) => ({
          value: user.id,
          label: user.fullName,
        }))}
        notFoundContent={
          userQuery.length > 0 &&
          (queryLoading ? (
            <LoadingOutlined spin />
          ) : (
            <div className="text-center">No results found</div>
          ))
        }
      />
    </div>
  );
}
