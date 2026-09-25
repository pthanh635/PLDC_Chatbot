import React from "react";
import { Icon } from "./Icon";

interface AddChatBtnProps {
  className?: string;
  onClick: () => void;
}

export const AddChatBtn: React.FC<AddChatBtnProps> = ({
  className = "",
  onClick,
}) => (
  <button
    className={`w-8 h-8 flex items-center justify-center text-xl ${className}`}
    onClick={onClick}
  >
    <Icon name="plus" size={24} color="#000000" />
  </button>
);
