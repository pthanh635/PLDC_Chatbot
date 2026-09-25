import React, { useMemo, useState } from "react";
import type { StoredConversation } from "../utils/types";
import { Icon } from "../components/Icon";

interface HistoryProps {
  conversations: StoredConversation[];
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
  onNewChat: () => void;
}

const formatUpdatedAt = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Thời gian không xác định";
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

export const History: React.FC<HistoryProps> = ({
  conversations,
  onOpen,
  onDelete,
  onNewChat,
}) => {
  const [query, setQuery] = useState("");
  const filteredConversations = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("vi");
    if (!normalizedQuery) return conversations;
    return conversations.filter((conversation) =>
      conversation.title.toLocaleLowerCase("vi").includes(normalizedQuery)
    );
  }, [conversations, query]);

  return (
    <main className="min-h-0 w-full flex-1 overflow-y-auto bg-white px-4 py-8 md:px-10">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-sentgray-600">Kho lưu trữ cục bộ</p>
            <h1 className="text-2xl font-semibold text-sentgray-900">
              Lịch sử trò chuyện
            </h1>
          </div>
          <button
            type="button"
            onClick={onNewChat}
            className="flex items-center gap-2 rounded-lg bg-sentgray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-sentgray-700"
          >
            <Icon name="plus" size={16} color="currentColor" />
            Cuộc trò chuyện mới
          </button>
        </div>

        <label className="mb-6 block">
          <span className="sr-only">Tìm kiếm lịch sử</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Tìm theo câu hỏi đầu tiên..."
            className="w-full rounded-lg border border-sentgray-200 px-4 py-3 text-sm outline-none focus:border-sentgray-500"
          />
        </label>

        {filteredConversations.length === 0 ? (
          <div className="rounded-xl border border-dashed border-sentgray-300 px-6 py-14 text-center text-sentgray-600">
            {conversations.length === 0
              ? "Chưa có cuộc trò chuyện nào được lưu."
              : "Không tìm thấy cuộc trò chuyện phù hợp."}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredConversations.map((conversation) => (
              <article
                key={conversation.id}
                className="flex items-center gap-3 rounded-xl border border-sentgray-200 p-4 transition-colors hover:bg-sentgray-25"
              >
                <button
                  type="button"
                  onClick={() => onOpen(conversation.id)}
                  className="min-w-0 flex-1 text-left"
                >
                  <h2 className="truncate font-semibold text-sentgray-900">
                    {conversation.title}
                  </h2>
                  <p className="mt-1 text-xs text-sentgray-600">
                    {formatUpdatedAt(conversation.updatedAt)} · {conversation.chatSequence.length} tin nhắn
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(conversation.id)}
                  aria-label={`Xóa ${conversation.title}`}
                  title="Xóa cuộc trò chuyện"
                  className="rounded-md p-2 text-sentgray-500 hover:bg-red-50 hover:text-red-600"
                >
                  <Icon name="trash" size={18} color="currentColor" />
                </button>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
};
