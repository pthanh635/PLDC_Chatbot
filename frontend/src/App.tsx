import React, { useCallback, useState } from "react";
import "./styles/App.scss";
import { Sidebar } from "./components/Sidebar";
import { MobileHeader } from "./components/MobileHeader";
import { MobileNavbar } from "./components/MobileNavbar";
import Chat from "./pages/Chat";
import { History } from "./pages/History";
import { Documents } from "./pages/Documents";
import { deleteConversation, loadConversations } from "./utils/chatStorage";
import type { Page } from "./utils/constants";
import type { StoredConversation } from "./utils/types";
import { v4 as uuid } from "uuid";

const App: React.FC = () => {
  const [page, setPage] = useState<Page>("home");
  const [conversationId, setConversationId] = useState<string>(() => uuid());
  const [conversations, setConversations] = useState<StoredConversation[]>(() =>
    loadConversations()
  );

  const refreshConversations = useCallback(() => {
    setConversations(loadConversations());
  }, []);

  const onCreateNewChat = useCallback(() => {
    setConversationId(uuid());
    setPage("home");
  }, []);

  const onOpenConversation = useCallback((id: string) => {
    setConversationId(id);
    setPage("home");
  }, []);

  const onDeleteConversation = useCallback(
    (id: string) => {
      deleteConversation(id);
      if (id === conversationId) setConversationId(uuid());
      refreshConversations();
    },
    [conversationId, refreshConversations]
  );

  const renderPage = () => {
    if (page === "history") {
      return (
        <History
          conversations={conversations}
          onOpen={onOpenConversation}
          onDelete={onDeleteConversation}
          onNewChat={onCreateNewChat}
        />
      );
    }
    if (page === "documents") return <Documents />;
    return (
      <Chat
        conversationId={conversationId}
        onConversationChanged={refreshConversations}
      />
    );
  };

  return (
    <div className="app-container flex flex-col md:flex-row h-screen bg-white font-jakarta">
      {/* sidebar for desktop */}
      <Sidebar
        onCreateNewChat={onCreateNewChat}
        page={page}
        onNavigate={setPage}
      />
      <MobileHeader onCreateNewChat={onCreateNewChat} />
      {renderPage()}
      <MobileNavbar page={page} onNavigate={setPage} />
    </div>
  );
};

export default App;
