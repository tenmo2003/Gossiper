import { ConfigProvider } from "antd";
import { Peer } from "peerjs";
import { useState } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import AuthContext from "./contexts/AuthContext";
import CurrentRoomContext from "./contexts/CurrentRoomContext";
import InCallContext from "./contexts/InCallContext";
import IncomingCallContext from "./contexts/IncomingCallContext";
import IsCallerContext from "./contexts/IsCallerContext";
import PeerContext from "./contexts/PeerContext";
import Authenticate from "./pages/Authenticate/Authenticate";
import Call from "./pages/Call/Call";
import Messaging from "./pages/Messaging/Messaging";

function App() {
  const [user, setUser] = useState<any>();
  const [currentlyJoinedRoom, setCurrentlyJoinedRoom] = useState<any>();
  const [inCall, setInCall] = useState<boolean>(false);
  const [isCaller, setIsCaller] = useState<boolean>(false);
  const [peer, setPeer] = useState<Peer>();
  const [incomingCall, setIncomingCall] = useState<any>();

  return (
    <AuthContext.Provider value={{ user, setUser }}>
        <CurrentRoomContext.Provider
          value={{ currentlyJoinedRoom, setCurrentlyJoinedRoom }}
        >
          <PeerContext.Provider value={{ peer, setPeer }}>
            <IncomingCallContext.Provider
              value={{ incomingCall, setIncomingCall }}
            >
              <InCallContext.Provider value={{ inCall, setInCall }}>
                <IsCallerContext.Provider value={{ isCaller, setIsCaller }}>
                  <ConfigProvider
                    theme={{
                      components: {
                        Form: {
                          labelColor: "white",
                        },
                        Input: {
                          colorBorder: "rgb(55 65 81)",
                          colorBgContainer: "rgb(55 65 81)",
                        },
                        Select: {
                          optionActiveBg: "rgb(66, 92, 130)",
                          colorBgContainer: "rgb(55 65 81)",
                          colorBgElevated: "rgb(55 65 81)",
                        },
                      },
                      token: {
                        // fontFamily: "Roboto",
                        colorPrimary: "#4178cb",
                        colorText: "white",
                        colorIcon: "white",
                        colorIconHover: "#4286ed",
                        borderRadius: 4,
                        colorBorder: "rgb(55 65 81)",
                        colorTextPlaceholder: "#c7c7c7",
                      },
                    }}
                  >
                    <BrowserRouter>
                      <Routes>
                        <Route path="/">
                          <Route index element={<Messaging />} />
                          <Route path="/hello" element={<div>hello</div>} />
                        </Route>
                        <Route
                          path="/authenticate"
                          element={<Authenticate />}
                        />
                        <Route path="/call/:id" element={<Call />} />
                        <Route path="*" element={<div>Not Found</div>} />
                      </Routes>
                    </BrowserRouter>
                    <Toaster
                      position="top-center"
                      toastOptions={{
                        style: {
                          background: "#3766ad5c",
                          color: "white",
                          border: "none",
                        },
                        duration: 2000,
                      }}
                    />
                  </ConfigProvider>
                </IsCallerContext.Provider>
              </InCallContext.Provider>
            </IncomingCallContext.Provider>
          </PeerContext.Provider>
        </CurrentRoomContext.Provider>
    </AuthContext.Provider>
  );
}

export default App;
