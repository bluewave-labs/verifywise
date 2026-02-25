import fileReducer, { addFile, removeFile } from "../fileSlice";

describe("fileSlice", () => {
  const initialState = { files: [] as any[] };

  const mockFile = {
    id: "file-1",
    name: "document.pdf",
    type: "application/pdf",
    uploadDate: "2026-02-20",
    uploader: "John Doe",
  };

  it("should return initial state with empty files array", () => {
    const state = fileReducer(undefined, { type: "unknown" });
    expect(state).toEqual(initialState);
    expect(state.files).toHaveLength(0);
  });

  describe("addFile", () => {
    it("should add a file to the list", () => {
      const state = fileReducer(initialState, addFile(mockFile));
      expect(state.files).toHaveLength(1);
      expect(state.files[0]).toEqual(mockFile);
    });

    it("should append to existing files", () => {
      const stateWithFile = { files: [mockFile] };
      const newFile = { ...mockFile, id: "file-2", name: "report.docx" };
      const state = fileReducer(stateWithFile, addFile(newFile));
      expect(state.files).toHaveLength(2);
      expect(state.files[1].id).toBe("file-2");
    });
  });

  describe("removeFile", () => {
    it("should remove a file by id", () => {
      const stateWithFile = { files: [mockFile] };
      const state = fileReducer(stateWithFile, removeFile("file-1"));
      expect(state.files).toHaveLength(0);
    });

    it("should not remove files with different ids", () => {
      const stateWithFile = { files: [mockFile] };
      const state = fileReducer(stateWithFile, removeFile("nonexistent"));
      expect(state.files).toHaveLength(1);
    });

    it("should remove only the matching file from multiple", () => {
      const files = [
        mockFile,
        { ...mockFile, id: "file-2", name: "other.txt" },
        { ...mockFile, id: "file-3", name: "third.csv" },
      ];
      const state = fileReducer({ files }, removeFile("file-2"));
      expect(state.files).toHaveLength(2);
      expect(state.files.map((f) => f.id)).toEqual(["file-1", "file-3"]);
    });
  });
});
