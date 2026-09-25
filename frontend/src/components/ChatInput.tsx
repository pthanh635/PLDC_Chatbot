import React, { useState } from "react";
import TextareaAutosize from "react-textarea-autosize";
import { Icon } from "./Icon";
import type { LegalMode, ISentMessageContent } from "../utils/types";
import classNames from "classnames";
import logo from "../assets/logo.svg";
import { useIsMobile } from "../hooks/useIsMobile";

interface IChatInputProps {
  onSubmit: (data: ISentMessageContent, selectedMode: LegalMode) => void;
  onStop: () => void;
  isChatEmpty: boolean;
  isLoading: boolean;
}

export const ChatInput: React.FC<IChatInputProps> = (props) => {
  const [input, setInput] = useState<string>("");
  const [mode, setMode] = useState<LegalMode>("dinh_nghia");

  const suggestedPrompts = [
    "Pháp luật là gì?",
    "So sánh vi phạm hành chính và vi phạm dân sự.",
    "Chế định pháp luật là một hệ thống các quy phạm pháp luật điều chỉnh các quan hệ xã hội cùng loại, trong một lĩnh vực nhất định của đời sống xã hội.",
    "Phân tích một tình huống vi phạm pháp luật theo 4 yếu tố cấu thành.",
  ];
  const modes: { label: string; value: LegalMode }[] = [
    { label: "Nhận định", value: "nhan_dinh" },
    { label: "So sánh", value: "so_sanh" },
    { label: "Tình huống", value: "tinh_huong" },
    { label: "Định nghĩa", value: "dinh_nghia" },
  ];

  const isMobile = useIsMobile();

  const onClickSuggestedPrompt = (prompt: string) => {
    if (!props.isLoading) props.onSubmit({ text: prompt, files: [] }, mode);
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    if (input.trim() && !props.isLoading) {
      props.onSubmit({ text: input.trim(), files: [] }, mode);
      setInput("");
    }
  };

  return (
    <div
      className={classNames(
        "bg-white my-4 flex flex-col justify-end md:justify-center shrink-0 items-center px-4 md:px-0",
        props.isChatEmpty ? "flex-grow" : ""
      )}
    >
      {props.isChatEmpty ? (
        <div className="flex flex-col items-center justify-center">
          <img src={logo} alt="Logo" className="w-16 h-16 mb-8" />
        </div>
      ) : (
        ""
      )}
      <form
        onSubmit={handleSubmit}
        className={classNames(
          `relative transition-all w-full border-2 border-sentgray-300 rounded-xl outline-10 outline-transparent focus-within:outline-sentgray-100 md:w-[60vw] max-w-[1600px] min-w-[360px]`,
          !props.isChatEmpty ? "md:rounded-full" : "",
        )}
        style={{ boxShadow: "0px 0px 15.24px 0px #BBBBBB2E" }}
        tabIndex={-1}
      >
        {/* Legal mode selector inside input bar */}
        <div
          className={classNames(
            "absolute bottom-3 left-4 z-10 flex text-xs md:text-sm",
            props.isChatEmpty
              ? "md:left-28 md:bottom-2"
              : "md:right-16 md:left-auto md:bottom-1 pb-0.5"
          )}
        >
          <div className="inline-flex items-center bg-sentgray-25 rounded-full p-1 overflow-x-auto max-w-full">
            {modes.map((item) => (
              <button
                key={item.value}
                className={`px-2 md:px-3 py-1 rounded-full transition-colors whitespace-nowrap ${
                  mode === item.value
                    ? "bg-white shadow-sm text-sentgray-900"
                    : "text-sentgray-500 hover:text-gray-600"
                }`}
                onClick={(e) => {
                  e.preventDefault();
                  setMode(item.value);
                }}
                type="button"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-end gap-3 px-2 py-1">
          {/* Textarea */}
          <TextareaAutosize
            value={input}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setInput(e.target.value)
            }
            placeholder={
              props.isChatEmpty
                ? "Nhập câu hỏi Pháp luật đại cương..."
                : "Nhập câu hỏi tiếp theo..."
            }
            className={classNames(
              "min-h-[36px] max-h-[360px] px-10 pt-2 pb-12 flex-grow-1 bg-transparent text-base font-jakarta outline-none resize-none border-0 shadow-none focus:ring-0 focus:outline-none",
              props.isChatEmpty ? "md:px-3" : "md:pl-10 md:pr-60 md:pb-2"
            )}
            minRows={isMobile ? 3 : props.isChatEmpty ? 3 : 1}
            maxRows={isMobile ? 6 : props.isChatEmpty ? 9 : 1}
            spellCheck={false}
            onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
          />
          {/* Send button */}
          <button
            type="submit"
            disabled={!input.trim() || props.isLoading}
            className={classNames(
              "bg-sentgray-150 rounded-full w-10 h-10 flex items-center justify-center hover:bg-sentgray-300 disabled:bg-transparent border border-sentgray-200 transition disabled:opacity-50 mx-2 mb-2 md:mr-0",
              props.isChatEmpty ? "md:mb-1 md:ml-1" : "md:mb-0 md:ml-1"
            )}
            aria-label="Gửi câu hỏi"
          >
            <Icon name="right_arrow" size={20} color="#707070" />
          </button>
        </div>
      </form>
      {props.isChatEmpty ? (
        <div className="w-full flex flex-wrap justify-start gap-3 mt-4 mb-4 md:w-[60vw] max-w-[1600px] min-w-[360px]">
          {suggestedPrompts.map((prompt, idx) => (
            <button
              key={idx}
              className={classNames(
                "text-left px-4 py-3 bg-sentgray-100 border border-sentgray-200 text-sentgray-700 leading-[1.5] font-medium text-xs md:text-sm rounded-lg hover:bg-gray-50 transition-colors",
                !isMobile ? "font-nunito" : ""
              )}
              onClick={() => onClickSuggestedPrompt(prompt)}
            >
              {prompt}
            </button>
          ))}
        </div>
      ) : (
        ""
      )}
    </div>
  );
};
