import React, { useState } from "react";
import "./styles/App.scss";
import { Sidebar } from "./components/Sidebar";
import { MobileHeader } from "./components/MobileHeader";
import { MobileNavbar } from "./components/MobileNavbar";
import Chat from "./pages/Chat";

const App: React.FC = () => {
  const [currChatIdx, setCurrChatIdx] = useState<number>(0);
  const onCreateNewChat = () => {
    setCurrChatIdx(Number(currChatIdx) + 1);
  };
  return (
    <div className="app-container flex flex-col md:flex-row h-screen bg-white font-jakarta">
      {/* sidebar for desktop */}
      <Sidebar onCreateNewChat={onCreateNewChat} />
      <MobileHeader onCreateNewChat={onCreateNewChat} />
      <Chat currChatIdx={currChatIdx} />
      <MobileNavbar />
    </div>
  );
};

export default App;
