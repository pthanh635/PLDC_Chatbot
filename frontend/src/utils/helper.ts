export const getFileIcon = (fileType: string) => {
  if (fileType.startsWith("image/")) return "🖼️";
  if (fileType.includes("pdf")) return "📄";
  if (fileType.includes("doc")) return "📝";
  if (fileType.includes("sheet") || fileType.includes("excel")) return "📊";
  if (fileType.includes("video/")) return "🎥";
  if (fileType.includes("audio/")) return "🎵";
  return "📎";
};
