import React from "react";
import { AddChatBtn } from "./AddChatBtn";
import { AvatarBtn } from "./AvatarBtn";

interface IMobileHeaderProps {
  onCreateNewChat: () => void;
}

export const MobileHeader: React.FC<IMobileHeaderProps> = ({
  onCreateNewChat,
}) => {
  return (
    <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-sentgray-200">
      {/* Add new chat button */}
      <AddChatBtn onClick={onCreateNewChat} />
      {/* User avatar */}
      <AvatarBtn />
    </header>
  );
};
