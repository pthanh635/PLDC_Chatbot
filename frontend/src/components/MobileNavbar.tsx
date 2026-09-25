import React from "react";
import { Icon } from "./Icon";
import { navigationItems } from "../utils/constants";
import classNames from "classnames";

export const MobileNavbar: React.FC = () => {
  return (
    <>
      <nav className="md:hidden w-full bg-white border-t border-sentgray-200">
        <div className="flex items-center justify-around px-2">
          {navigationItems.map((item) => (
            <button
              key={item.label}
              className={`w-20 flex flex-col items-center ${
                item.active ? "text-sentgray-900" : "text-sentgray-600"
              }`}
              disabled={item.disabled}
            >
              <div
                className={classNames(
                  "w-full h-1 rounded-bl-2xl rounded-br-2xl",
                  item.active ? "bg-sentgray-900" : ""
                )}
              ></div>
              <div className="flex flex-col items-center p-2 rounded-lg ">
                <Icon
                  name={item.icon}
                  size={22}
                  color={item.active ? "#212222" : "#A9A9A9"}
                  className="mb-1"
                />
                <span className="text-base">{item.label}</span>
              </div>
            </button>
          ))}
        </div>
        <div className="w-full flex justify-center my-2">
          <div className="w-[40%] h-1 rounded-full bg-sentgray-250"></div>
        </div>
      </nav>
    </>
  );
};
