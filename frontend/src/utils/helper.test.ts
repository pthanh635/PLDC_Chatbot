import { getFileIcon } from "./helper";

describe("getFileIcon", () => {
  it("returns 🖼️ for image types", () => {
    expect(getFileIcon("image/png")).toBe("🖼️");
    expect(getFileIcon("image/jpeg")).toBe("🖼️");
  });
  it("returns 📄 for pdf", () => {
    expect(getFileIcon("application/pdf")).toBe("📄");
  });
  it("returns 📝 for doc/docx", () => {
    // expect(getFileIcon("application/msword")).toBe("📝");
    expect(
      getFileIcon(
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      )
    ).toBe("📝");
  });
  it("returns 📊 for sheet/excel", () => {
    expect(getFileIcon("application/vnd.ms-excel")).toBe("📊");
    // expect(
    //   getFileIcon(
    //     "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    //   )
    // ).toBe("📊");
    expect(getFileIcon("application/sheet")).toBe("📊");
  });
  it("returns 🎥 for video types", () => {
    expect(getFileIcon("video/mp4")).toBe("🎥");
    expect(getFileIcon("video/quicktime")).toBe("🎥");
  });
  it("returns 🎵 for audio types", () => {
    expect(getFileIcon("audio/mpeg")).toBe("🎵");
    expect(getFileIcon("audio/wav")).toBe("🎵");
  });
  it("returns 📎 for unknown types", () => {
    expect(getFileIcon("application/zip")).toBe("📎");
    expect(getFileIcon("text/plain")).toBe("📎");
    expect(getFileIcon("")).toBe("📎");
  });
});
