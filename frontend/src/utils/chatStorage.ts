import type { StoredConversation } from "./types";
import type {
  IChatSequence,
  IReceivedMessage,
  ISentMessage,
  LegalMode,
} from "./types";

const STORAGE_KEY = "pldc-chat-conversations";

const legalModes: LegalMode[] = [
  "nhan_dinh",
  "so_sanh",
  "tinh_huong",
  "dinh_nghia",
];

const isSentMessage = (value: unknown): value is ISentMessage => {
  if (typeof value !== "object" || value === null) return false;
  const item = value as Partial<ISentMessage>;
  return (
    typeof item.id === "string" &&
    typeof item.content === "object" &&
    item.content !== null &&
    typeof item.content.text === "string" &&
    Array.isArray(item.content.files) &&
    typeof item.mode === "string" &&
    legalModes.includes(item.mode as LegalMode)
  );
};

const isReceivedMessage = (value: unknown): value is IReceivedMessage => {
  if (typeof value !== "object" || value === null) return false;
  const item = value as Partial<IReceivedMessage>;
  return (
    typeof item.id === "string" &&
    typeof item.text === "string" &&
    (item.isLiked === 0 || item.isLiked === 1 || item.isLiked === 2)
  );
};

const isChatSequence = (value: unknown): value is IChatSequence => {
  if (typeof value !== "object" || value === null) return false;
  const item = value as Partial<IChatSequence>;
  return (
    typeof item.id === "string" &&
    (item.type === "sent" || item.type === "received")
  );
};

const isStoredConversation = (value: unknown): value is StoredConversation => {
  if (typeof value !== "object" || value === null) return false;
  const item = value as Partial<StoredConversation>;
  return (
    typeof item.id === "string" &&
    typeof item.title === "string" &&
    typeof item.updatedAt === "string" &&
    Array.isArray(item.sentMessages) &&
    item.sentMessages.every(isSentMessage) &&
    Array.isArray(item.receivedMessages) &&
    item.receivedMessages.every(isReceivedMessage) &&
    Array.isArray(item.chatSequence) &&
    item.chatSequence.every(isChatSequence)
  );
};

export function loadConversations(): StoredConversation[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isStoredConversation);
  } catch (error) {
    console.error("Không thể đọc lịch sử trò chuyện.", error);
    return [];
  }
}

export function loadConversation(id: string): StoredConversation | null {
  return loadConversations().find((conversation) => conversation.id === id) ?? null;
}

export function saveConversation(conversation: StoredConversation): void {
  try {
    const conversations = loadConversations().filter(
      (item) => item.id !== conversation.id
    );
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([conversation, ...conversations])
    );
  } catch (error) {
    console.error("Không thể lưu lịch sử trò chuyện.", error);
  }
}

export function deleteConversation(id: string): void {
  try {
    const conversations = loadConversations().filter((item) => item.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations));
  } catch (error) {
    console.error("Không thể xóa cuộc trò chuyện.", error);
  }
}
