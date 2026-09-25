import React, { useEffect, useMemo, useState } from "react";
import { ChatArea } from "../components/ChatArea";
import { ChatInput } from "../components/ChatInput";
import { v4 as uuid } from "uuid";
import { sendChat } from "../api/chat";
import { loadConversation, saveConversation } from "../utils/chatStorage";
import type {
  IChatSequence,
  IReceivedMessage,
  LegalMode,
  ISentMessage,
  ISentMessageContent,
} from "../utils/types";
import { Icon } from "../components/Icon";

interface IChatProps {
  conversationId: string;
  onConversationChanged: () => void;
}
const Chat: React.FC<IChatProps> = ({
  conversationId,
  onConversationChanged,
}) => {
  const [sentMessages, setSentMessages] = useState<ISentMessage[]>([]);
  const [receivedMessages, setReceivedMessages] = useState<IReceivedMessage[]>(
    []
  );
  const [chatSequence, setChatSequence] = useState<IChatSequence[]>([]);
  const [loadingStep, setLoadingStep] = useState<0 | 1 | 2>(0);

  const chatTitle = useMemo(() => {
    return sentMessages.length > 0 ? sentMessages[0].content.text : "";
  }, [sentMessages]);

  useEffect(() => {
    const conversation = loadConversation(conversationId);
    setSentMessages(conversation?.sentMessages ?? []);
    setReceivedMessages(conversation?.receivedMessages ?? []);
    setChatSequence(conversation?.chatSequence ?? []);
    setLoadingStep(0);
  }, [conversationId]);

  useEffect(() => {
    if (!sentMessages.length) return;
    saveConversation({
      id: conversationId,
      title: sentMessages[0].content.text,
      updatedAt: new Date().toISOString(),
      sentMessages,
      receivedMessages,
      chatSequence,
    });
    onConversationChanged();
  }, [
    chatSequence,
    conversationId,
    onConversationChanged,
    receivedMessages,
    sentMessages,
  ]);

  const onStartLoading = async (question: string, mode: LegalMode) => {
    setLoadingStep(1);
    try {
      const data = await sendChat(mode, question);
      const receivedId = uuid();
      setReceivedMessages((prev) => [
        ...prev,
        { id: receivedId, text: data.answer, sources: data.sources, isLiked: 0 },
      ]);
      setChatSequence((seq) => [...seq, { id: receivedId, type: "received" }]);
    } catch (error) {
      console.error(error);
      const receivedId = uuid();
      const message =
        error instanceof Error
          ? error.message
          : "Không thể xử lý câu hỏi lúc này. Vui lòng thử lại.";
      setReceivedMessages((prev) => [
        ...prev,
        {
          id: receivedId,
          text: `Xin lỗi, đã xảy ra lỗi: ${message}`,
          isLiked: 0,
        },
      ]);
      setChatSequence((seq) => [...seq, { id: receivedId, type: "received" }]);
    } finally {
      setLoadingStep(0);
    }
  };

  const onChatSubmit = (
    data: ISentMessageContent,
    selectedMode: LegalMode
  ) => {
    if (loadingStep !== 0 || !data.text.trim()) return;
    const sentId = uuid();
    setSentMessages((prev) => [
      ...prev,
      { id: sentId, content: { text: data.text, files: [] }, mode: selectedMode },
    ]);
    setChatSequence((seq) => [...seq, { id: sentId, type: "sent" }]);
    void onStartLoading(data.text, selectedMode);
  };

  const onChatStop = () => {
    // TODO: on chat stop button click
  };

  const onClickLikeDislikeButton = (msgId: string, isLiked: 0 | 1 | 2) => {
    const newReceivedMsgs = [...receivedMessages];
    const index = newReceivedMsgs.findIndex((msg) => msg.id === msgId);
    newReceivedMsgs[index] = {
      ...newReceivedMsgs[index],
      isLiked: isLiked,
    };
    setReceivedMessages(newReceivedMsgs);
  };

  return (
    <div className="min-h-0 relative w-full flex-grow font-jakarta flex justify-center">
      {/* Main Content Area */}
      <main className="min-h-0 w-full h-full flex flex-col">
        {/* Chat Area */}
        {sentMessages.length ? (
          <ChatArea
            sentMessages={sentMessages}
            receivedMessages={receivedMessages}
            chatSequence={chatSequence}
            loadingStep={loadingStep}
            chatTitle={chatTitle}
            onClickLikeDislikeButton={onClickLikeDislikeButton}
          />
        ) : (
          ""
        )}
        {/* Chat Input */}
        <ChatInput
          onSubmit={onChatSubmit}
          onStop={onChatStop}
          isChatEmpty={!sentMessages.length}
          isLoading={loadingStep !== 0}
        />
        <button className="hidden md:flex fixed bottom-4 right-4">
          <Icon name="question_circle" size={30} color="#808080" />
        </button>
      </main>
    </div>
  );
};

export default Chat;
