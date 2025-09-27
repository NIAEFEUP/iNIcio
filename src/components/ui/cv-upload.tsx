"use client";

import { useState } from "react";
import { useCVUpload } from "@/lib/hooks/use-file-upload";
import { FileUpload } from "./file-upload";

interface CVUploadProps {
  onSuccess?: (result: { fileName: string; url: string }) => void;
  onError?: (error: string) => void;
  required?: boolean;
  disabled?: boolean;
}

export function CVUpload({
  onSuccess,
  onError,
  required = false,
  disabled = false,
}: CVUploadProps) {
  const [validationError, setValidationError] = useState<string | null>(null);

  const {
    isUploading,
    uploadProgress,
    error: uploadError,
    uploadedFile,
    uploadCV,
    deleteFile,
    resetState,
  } = useCVUpload({
    onSuccess: (result) => {
      setValidationError(null); // Clear validation error on success
      onSuccess?.(result);
    },
    onError,
  });

  // Combine validation and upload errors
  const displayError = validationError || uploadError;

  const handleFileSelect = async (file: File) => {
    setValidationError(null); // Clear previous validation errors
    await uploadCV(file);
  };

  const handleFileRemove = async () => {
    setValidationError(null); // Clear validation errors when removing file
    if (uploadedFile) {
      await deleteFile(uploadedFile.fileName);
    }
    resetState();
  };

  const handleValidationError = (errorMessage: string) => {
    setValidationError(errorMessage);
    onError?.(errorMessage);
  };

  return (
    <FileUpload
      type="document"
      onFileSelect={handleFileSelect}
      onFileRemove={handleFileRemove}
      onValidationError={handleValidationError}
      currentFileName={uploadedFile?.fileName}
      isUploading={isUploading}
      uploadProgress={uploadProgress}
      error={displayError}
      required={required}
      disabled={disabled}
      accept=".pdf"
      maxSize={10}
    />
  );
}
