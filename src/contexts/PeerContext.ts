import Peer from "peerjs";
import { createContext } from "react";

const PeerContext = createContext<{
  peer: Peer | undefined;
  setPeer: (peer: Peer) => void;
}>({ peer: undefined, setPeer: () => {} });

export default PeerContext;
