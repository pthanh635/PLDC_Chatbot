import React from "react";
import logo from "../assets/logo.svg";
import { Icon } from "./Icon";
import { navigationItems } from "../utils/constants";
import classNames from "classnames";
import { AvatarBtn } from "./AvatarBtn";
import { AddChatBtn } from "./AddChatBtn";
import type { Page } from "../utils/constants";

interface ISidebarProps {
  onCreateNewChat: () => void;
  page: Page;
  onNavigate: (page: Page) => void;
}

export const Sidebar: React.FC<ISidebarProps> = ({
  onCreateNewChat,
  page,
  onNavigate,
}) => {
  return (
    <>
      <aside className="hidden md:flex flex-col justify-between group bg-sentgray-50 border-r border-sentgray-200 transition-all duration-300 w-[64px] hover:w-[250px]">
        <div className="p-4">
          <div className="flex items-center">
            <img src={logo} alt="Logo" className="w-8 h-8" />
            <span className="ml-2 pb-1 text-2xl font-semibold text-sentgray-900 overflow-hidden transition-all duration-300 opacity-0 max-w-0 scale-x-0 group-hover:opacity-100 group-hover:max-w-[160px] group-hover:scale-x-100 origin-left whitespace-nowrap">
              LegalGPT
            </span>
          </div>
        </div>

        <nav className="flex flex-col space-y-3">
          {navigationItems.map((item) => (
            <button
              key={item.label}
              className="w-full flex items-stretch justify-between"
              onClick={() => onNavigate(item.page)}
            >
              <div
                className={classNames(
                  "w-full flex pl-5 py-3 text-left transition-colors",
                  page === item.page
                    ? "text-sentgray-900"
                    : "text-sentgray-600 hover:text-sentgray-900"
                )}
              >
                <Icon
                  name={item.icon}
                  size={22}
                  color={page === item.page ? "#212222" : "#A9A9A9"}
                />
                <span className="ml-3 font-semibold overflow-hidden transition-all duration-300 opacity-0 max-w-0 scale-x-0 group-hover:opacity-100 group-hover:max-w-[120px] group-hover:scale-x-100 origin-left whitespace-nowrap">
                  {item.label}
                </span>
              </div>
              <div
                className={classNames(
                  "h-full w-2 rounded-tl-2xl rounded-bl-2xl",
                  page === item.page ? "bg-sentgray-900" : ""
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
