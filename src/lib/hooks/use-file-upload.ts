"use client";

import { useState, useCallback } from "react";
import { validateFile, FileValidationResult } from "@/lib/file-upload";

export interface UploadState {
  isUploading: boolean;
  uploadProgress: number;
  error: string | null;
  uploadedFile: {
    fileName: string;
    url: string;
  } | null;
}

export interface UseFileUploadOptions {
  onSuccess?: (result: { fileName: string; url: string }) => void;
  onError?: (error: string) => void;
  onProgress?: (progress: number) => void;
}

export function useFileUpload(options: UseFileUploadOptions = {}) {
  const [state, setState] = useState<UploadState>({
    isUploading: false,
    uploadProgress: 0,
    error: null,
    uploadedFile: null,
  });

  const uploadFile = useCallback(
    async (
      file: File,
      type: "profile" | "cv",
    ): Promise<{
      success: boolean;
      fileName?: string;
      url?: string;
      error?: string;
    }> => {
      setState({
        isUploading: true,
        uploadProgress: 0,
        error: null,
        uploadedFile: null,
      });

      try {
        const validation: FileValidationResult = validateFile(
          file,
          type === "profile" ? "image" : "document",
        );

        if (!validation.isValid) {
          const error = validation.error || "File validation failed";
          setState((prev) => ({
            ...prev,
            isUploading: false,
            error,
          }));
          options.onError?.(error);
          return { success: false, error };
        }

        const formData = new FormData();
        formData.append("file", file);
        formData.append("type", type);

        const xhr = new XMLHttpRequest();

        xhr.upload.addEventListener("progress", (event) => {
          if (event.lengthComputable) {
            const progress = Math.round((event.loaded * 100) / event.total);
            setState((prev) => ({
              ...prev,
              uploadProgress: progress,
            }));
            options.onProgress?.(progress);
          }
        });

        const uploadPromise = new Promise<{ fileName: string; url: string }>(
          (resolve, reject) => {
            xhr.addEventListener("load", () => {
              if (xhr.status === 200) {
                try {
                  const response = JSON.parse(xhr.responseText);
                  resolve({
                    fileName: response.fileName,
                    url: response.url,
                  });
                } catch (parseError) {
                  console.error("Response parse error:", parseError);
                  reject(new Error("Invalid response format"));
                }
              } else {
                try {
                  const errorResponse = JSON.parse(xhr.responseText);
                  reject(
                    new Error(
                      errorResponse.error ||
                        `Upload failed with status ${xhr.status}`,
                    ),
                  );
                } catch (parseError) {
                  console.error("Response parse error:", parseError);
                  reject(new Error(`Upload failed with status ${xhr.status}`));
                }
              }
            });

            xhr.addEventListener("error", () => {
              reject(new Error("Network error during upload"));
            });

            xhr.addEventListener("timeout", () => {
              reject(new Error("Upload timeout"));
            });
          },
        );

        xhr.open("POST", "/api/upload");
        xhr.timeout = 60000; // 60 second timeout
        xhr.send(formData);

        const result = await uploadPromise;

        setState((prev) => ({
          ...prev,
          isUploading: false,
          uploadProgress: 100,
          uploadedFile: result,
        }));

        options.onSuccess?.(result);
        return { success: true, ...result };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Upload failed";

        setState((prev) => ({
          ...prev,
          isUploading: false,
          uploadProgress: 0,
          error: errorMessage,
        }));

        options.onError?.(errorMessage);
        return { success: false, error: errorMessage };
      }
    },
    [options],
  );

  const deleteFile = useCallback(
    async (fileName: string): Promise<{ success: boolean; error?: string }> => {
      try {
        const response = await fetch(
          `/api/upload?fileName=${encodeURIComponent(fileName)}`,
          {
            method: "DELETE",
          },
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Delete failed");
        }

        setState((prev) => ({
          ...prev,
          uploadedFile:
            prev.uploadedFile?.fileName === fileName ? null : prev.uploadedFile,
        }));

        return { success: true };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Delete failed";
        return { success: false, error: errorMessage };
      }
    },
    [],
  );

  const resetState = useCallback(() => {
    setState({
      isUploading: false,
      uploadProgress: 0,
      error: null,
      uploadedFile: null,
    });
  }, []);

  return {
    ...state,
    uploadFile,
    deleteFile,
    resetState,
  };
}

export function useProfileImageUpload(options: UseFileUploadOptions = {}) {
  const fileUpload = useFileUpload(options);

  const uploadProfileImage = useCallback(
    (file: File) => {
      return fileUpload.uploadFile(file, "profile");
    },
    [fileUpload],
  );

  return {
    ...fileUpload,
    uploadProfileImage,
  };
}

export function useCVUpload(options: UseFileUploadOptions = {}) {
  const fileUpload = useFileUpload(options);

  const uploadCV = useCallback(
    (file: File) => {
      return fileUpload.uploadFile(file, "cv");
    },
    [fileUpload],
  );

  return {
    ...fileUpload,
    uploadCV,
  };
}
