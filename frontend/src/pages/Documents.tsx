import React, { useCallback, useEffect, useRef, useState } from "react";
import { API_BASE_URL } from "../api/chat";
import { Icon } from "../components/Icon";

const PDF_VIEW_URL = `${API_BASE_URL}/documents/pldc`;
const PDF_DOWNLOAD_URL = `${API_BASE_URL}/documents/pldc/download`;

export const Documents: React.FC = () => {
  const [status, setStatus] = useState<"checking" | "ready" | "error">("checking");
  const hasCheckedOnMount = useRef(false);

  const checkDocument = useCallback(async () => {
    setStatus("checking");
    try {
      const response = await fetch(PDF_VIEW_URL, { method: "HEAD" });
      setStatus(response.ok ? "ready" : "error");
    } catch {
      setStatus("error");
    }
  }, []);

  useEffect(() => {
    if (hasCheckedOnMount.current) return;
    hasCheckedOnMount.current = true;
    void checkDocument();
  }, [checkDocument]);

  const retryDocumentCheck = () => {
    void checkDocument();
  };

  return (
    <main className="min-h-0 w-full flex-1 overflow-y-auto bg-sentgray-25 px-4 py-6 md:px-10">
      <div className="mx-auto flex h-full max-w-6xl flex-col">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm text-sentgray-600">Tài liệu tham khảo</p>
            <h1 className="text-2xl font-semibold text-sentgray-900">
              Giáo trình Pháp luật đại cương
            </h1>
          </div>
          {status === "ready" && (
            <a
              href={PDF_DOWNLOAD_URL}
              className="flex items-center gap-2 rounded-lg bg-sentgray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-sentgray-700"
            >
              <Icon name="download" size={17} color="currentColor" />
              Tải PDF
            </a>
          )}
        </div>

        {status === "checking" && (
          <div className="flex flex-1 items-center justify-center rounded-xl border border-sentgray-200 bg-white text-sentgray-600">
            Đang kiểm tra tài liệu...
          </div>
        )}
        {status === "error" && (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 rounded-xl border border-red-200 bg-red-50 px-6 text-center text-red-700">
            <p>
              Không thể tải giáo trình. File PDF chưa được phục vụ hoặc backend chưa chạy.
            </p>
            <button
              type="button"
              onClick={retryDocumentCheck}
              className="rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-100"
            >
              Thử lại
            </button>
          </div>
        )}
        {status === "ready" && (
          <iframe
            title="Giáo trình Pháp luật đại cương"
            src={PDF_VIEW_URL}
            className="min-h-[70vh] flex-1 rounded-xl border border-sentgray-200 bg-white"
          />
        )}
      </div>
    </main>
  );
};
