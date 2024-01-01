import { Tabs } from "antd";
import LoginTab from "./LoginTab";
import SignupTab from "./SignupTab";

export default function Authenticate() {
  const tabs = [
    {
      key: "1",
      label: <span className="text-lg">Login</span>,
      children: <LoginTab />,
      width: "50%",
    },
    {
      key: "2",
      label: <span className="text-lg">Signup</span>,
      children: <SignupTab />,
      width: "50%",
    },
  ];

  return (
    <div
      className="h-screen w-full flex items-center justify-center"
      style={{ background: "linear-gradient(#141e30, #243b55)" }}
    >
      <div className="w-[30rem] rounded-xl shadow-2xl shadow-black min-h-[50%] flex flex-col gap-4 items-center justify-center bg-black bg-opacity-50 text-white p-10">
        <Tabs defaultActiveKey="1" items={tabs} className="w-full" centered />
      </div>
    </div>
  );
}
