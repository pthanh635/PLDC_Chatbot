import React from "react";
import logo from "../assets/logo.svg";
import { Icon } from "./Icon";
import { navigationItems } from "../utils/constants";
import classNames from "classnames";
import { AvatarBtn } from "./AvatarBtn";
import { AddChatBtn } from "./AddChatBtn";

interface ISidebarProps {
  onCreateNewChat: () => void;
}

export const Sidebar: React.FC<ISidebarProps> = ({ onCreateNewChat }) => {
  return (
    <>
      <aside className="hidden md:flex flex-col justify-between group bg-sentgray-50 border-r border-sentgray-200 transition-all duration-300 w-[64px] hover:w-[250px]">
        <div className="p-4">
          <div className="flex items-center">
            <img src={logo} alt="Logo" className="w-8 h-8" />
            <span className="ml-2 pb-1 text-2xl font-semibold text-sentgray-900 overflow-hidden transition-all duration-300 opacity-0 max-w-0 scale-x-0 group-hover:opacity-100 group-hover:max-w-[160px] group-hover:scale-x-100 origin-left whitespace-nowrap">
              Chatbot Pháp luật đại cương
            </span>
          </div>
        </div>

        <nav className="flex flex-col space-y-3">
          {navigationItems.map((item) => (
            <button
              key={item.label}
              className="w-full flex items-stretch justify-between"
              disabled={item.disabled}
            >
              <div
                className={classNames(
                  "w-full flex pl-5 py-3 text-left transition-colors",
                  item.disabled
                    ? "text-sentgray-400 cursor-not-allowed"
                    : "text-sentgray-900 hover:cursor-pointer"
                )}
              >
                <Icon
                  name={item.icon}
                  size={22}
                  color={item.active ? "#212222" : "#A9A9A9"}
                />
                <span className="ml-3 font-semibold overflow-hidden transition-all duration-300 opacity-0 max-w-0 scale-x-0 group-hover:opacity-100 group-hover:max-w-[120px] group-hover:scale-x-100 origin-left whitespace-nowrap">
                  {item.label}
                </span>
              </div>
              <div
                className={classNames(
                  "h-full w-2 rounded-tl-2xl rounded-bl-2xl",
                  item.active ? "bg-sentgray-900" : ""
                )}
              ></div>
            </button>
          ))}
        </nav>
        <div className="flex flex-col items-start gap-6 pl-3 pb-6">
          {/* Add new chat button */}
          <AddChatBtn onClick={onCreateNewChat} />
          {/* User avatar */}
          <AvatarBtn />
        </div>
      </aside>
    </>
  );
};
