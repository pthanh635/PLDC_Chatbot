import React, { useMemo, useRef, useEffect } from "react";
import logo from "../assets/logo.svg";
import { Icon } from "./Icon";
import { MarkdownMessage } from "./MarkdownMessage";
import { AnimatedMarkdownMessage } from "./AnimatedMarkdownMessage";
import type {
  IChatSequence,
  IReceivedMessage,
  ISentMessage,
} from "../utils/types";
import { getFileIcon } from "../utils/helper";
import { Copy } from "./Copy";

interface IChatAreaProps {
  receivedMessages: IReceivedMessage[];
  sentMessages: ISentMessage[];
  chatSequence: IChatSequence[];
  loadingStep: 0 | 1 | 2;
  chatTitle: string;
  onClickLikeDislikeButton: (msgId: string, isLiked: 0 | 1 | 2) => void;
}

export const ChatArea: React.FC<IChatAreaProps> = (props) => {
  const {
    sentMessages,
    receivedMessages,
    chatSequence,
    loadingStep,
    chatTitle,
    onClickLikeDislikeButton,
  } = props;

  // Helper to get message by id and type
  const getMessage = (id: string, type: "sent" | "received") => {
    if (type === "sent") {
      return sentMessages.find((m) => m.id === id);
    }
    return receivedMessages.find((m) => m.id === id);
  };

  // Auto-scroll to bottom when chatSequence or loadingStep changes
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatSequence, loadingStep, scrollRef]);

  // Find the last received message id
  const lastReceivedId = useMemo(() => {
    for (let i = chatSequence.length - 1; i >= 0; i--) {
      if (chatSequence[i].type === "received") return chatSequence[i].id;
    }
    return null;
  }, [chatSequence]);

  return (
    <div
      ref={scrollRef}
      className="flex-1 min-h-0 overflow-y-auto px-4 bg-white"
    >
      <div className="mx-auto md:w-[60vw] pb-4 max-w-[1600px] min-w-[360px]">
        {/* Chat Title */}
        {chatTitle && (
          <h1 className="text-lg md:text-xl font-semibold md:font-medium mb-8 px-8 rounded-xl rounded-tl-none rounded-tr-none border border-t-0 border-sentgray-200 sticky top-0 bg-white z-10 pt-4 pb-4">
            {chatTitle}
          </h1>
        )}
        <div className="space-y-6">
          {chatSequence.map((item, idx) => {
            // Don't show the first sent message as a bubble (it's the title)
            if (idx === 0 && item.type === "sent") return null;
            const msg = getMessage(item.id, item.type);
            if (!msg) return null;
            if (
              item.type === "sent" &&
              "content" in msg &&
              msg.content &&
              typeof msg.content.text === "string"
            ) {
              return (
                <div key={msg.id} className="flex justify-end">
                  <div className="group relative max-w-[85%] md:max-w-[75%] ml-4">
                    <div className="px-4 py-3 rounded-2xl bg-white border border-sentgray-200 break-words">
                      <MarkdownMessage content={msg.content.text} />
                    </div>
                    {/* File previews for sent message */}
                    {msg.content.files && msg.content.files.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {msg.content.files.map((uploadedFile) => (
                          <div
                            key={uploadedFile.id}
                            className="relative bg-sentgray-50 rounded-lg p-0.5 flex items-start max-w-xs"
                          >
                            {/* Thumbnail or file icon */}
                            <div>
                              {uploadedFile.preview ? (
                                <img
                                  src={uploadedFile.preview}
                                  alt={uploadedFile.file.name}
                                  className="w-6 h-8 object-cover rounded"
                                />
                              ) : (
                                <div className="w-6 h-8 bg-sentgray-200 rounded flex items-center justify-center text-lg">
                                  {getFileIcon(uploadedFile.file.type)}
                                </div>
                              )}
                            </div>
                            {/* No remove button here */}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            } else if (
              item.type === "received" &&
              "text" in msg &&
              typeof msg.text === "string"
            ) {
              const isLast = msg.id === lastReceivedId && loadingStep === 0;
              return (
                <div
                  key={msg.id}
                  className="flex flex-col md:flex-row items-start"
                >
                  <div className="flex-shrink-0 bg-white flex items-center justify-center mr-3 mt-1 pl-3 md:pl-0 md:mt-4">
                    <img src={logo} alt="AI" className="w-6 h-6 rounded-full" />
                    <p className="md:hidden text-lg ml-2 text-sentgray-900">
                      Trợ lý PLĐC
                    </p>
                  </div>
                  <div className="group relative max-w-[85%] md:max-w-[75%] mr-4">
                    <div className="px-4 py-3 rounded-2xl bg-white break-words">
                      {isLast ? (
                        <AnimatedMarkdownMessage content={msg.text} />
                      ) : (
                        <MarkdownMessage content={msg.text} />
                      )}
                    </div>
                    <div className="flex items-center justify-between mt-2 px-4 text-sm text-gray-500">
                      <Copy value={msg.text} />
                      <div className="flex gap-4">
                        <button
                          className="hover:text-gray-700 transition-colors"
                          onClick={() =>
                            onClickLikeDislikeButton(
                              msg.id,
                              msg.isLiked === 1 ? 0 : 1
                            )
                          }
                        >
                          <Icon
                            name="thumbs_up"
                            size={16}
                            color={
                              msg.isLiked === 1 ? "#212222" : "currentColor"
                            }
                          />
                        </button>
                        <button
                          className="hover:text-gray-700 transition-colors"
                          onClick={() =>
                            onClickLikeDislikeButton(
                              msg.id,
                              msg.isLiked === 2 ? 0 : 2
                            )
                          }
                        >
                          <Icon
                            name="thumbs_down"
                            size={16}
                            color={
                              msg.isLiked === 2 ? "#212222" : "currentColor"
                            }
                          />
                        </button>
                      </div>
                    </div>
                    {msg.sources && msg.sources.length > 0 && (
                      <details className="mt-3 mx-4 text-xs text-gray-500">
                        <summary className="cursor-pointer select-none font-medium text-gray-600">
                          Nguồn tham khảo ({msg.sources.length})
                        </summary>
                        <div className="mt-2 space-y-2">
                          {msg.sources.map((source, sourceIndex) => (
                            <details
                              key={`${source.source}-${source.page}-${sourceIndex}`}
                              className="rounded-lg bg-sentgray-50 px-3 py-2"
                            >
                              <summary className="cursor-pointer">
                                {source.source} · trang {source.page}
                              </summary>
                              <p className="mt-2 leading-relaxed text-gray-600">
                                {source.text_preview}
                              </p>
                              {source.score !== null && (
                                <p className="mt-1 text-gray-400">
                                  Score: {source.score.toFixed(3)}
                                </p>
                              )}
                            </details>
                          ))}
                        </div>
                      </details>
                    )}
                  </div>
                </div>
              );
            }
            return null;
          })}
          {/* Loading bubble for assistant */}
          {(loadingStep === 1 || loadingStep === 2) && (
            <div className="flex items-start">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-white flex items-center justify-center mr-3 mt-1">
                <img src={logo} alt="AI" className="w-5 h-5" />
              </div>
              <div className="group relative max-w-[85%] md:max-w-[75%] mr-4">
                <div className="px-4 py-3 rounded-2xl">
                  <span className="animated-gradient-text">
                    Đang phân tích tài liệu...
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
