import { useState, useCallback, useEffect } from "react";
import type { FileUploadState } from "@/types/agents";

export function useFileUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = useCallback((selectedFile?: File) => {
    if (!selectedFile) return;

    setFile(selectedFile);
    
    // Create preview URL
    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(prev => {
      // Clean up previous URL to prevent memory leaks
      if (prev) URL.revokeObjectURL(prev);
      return url;
    });
  }, []);

  const removeFile = useCallback(() => {
    setFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
  }, [previewUrl]);

  // Clean up preview URL when component unmounts
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const state: FileUploadState = {
    file,
    previewUrl,
    uploading,
  };

  return {
    state,
    file,
    previewUrl,
    uploading,
    setFile,
    setUploading,
    handleFileSelect,
    removeFile,
  };
}
