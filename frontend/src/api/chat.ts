import type { ChatResponse, LegalMode } from "../utils/types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

export async function sendChat(
  mode: LegalMode,
  question: string
): Promise<ChatResponse> {
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode, question }),
    });
  } catch {
    throw new Error("Không thể kết nối đến máy chủ. Vui lòng thử lại sau.");
  }

  if (!response.ok) {
    let detail = "Yêu cầu không thành công. Vui lòng thử lại sau.";
    try {
      const errorBody: unknown = await response.json();
      if (
        typeof errorBody === "object" &&
        errorBody !== null &&
        "detail" in errorBody &&
        typeof errorBody.detail === "string"
      ) {
        detail = errorBody.detail;
      }
    } catch {
      // Keep the generic message when the error body is not JSON.
    }
    throw new Error(detail);
  }

  return (await response.json()) as ChatResponse;
}
