"use client";

import React, { useRef, useState } from "react";
import { Camera, FileText, Upload, X, Check, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  onFileSelect?: (file: File) => void;
  onFileRemove?: () => void;
  onValidationError?: (error: string) => void;
  accept?: string;
  maxSize?: number; // in MB
  type: "image" | "document";
  currentFileName?: string;
  isUploading?: boolean;
  uploadProgress?: number;
  error?: string | null;
  required?: boolean;
  disabled?: boolean;
}

export function FileUpload({
  onFileSelect,
  onFileRemove,
  onValidationError,
  accept,
  maxSize,
  type,
  currentFileName,
  isUploading = false,
  uploadProgress = 0,
  error,
  required = false,
  disabled = false,
}: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const Icon = type === "image" ? Camera : FileText;
  const acceptTypes = accept || (type === "image" ? "image/*" : ".pdf");
  const maxSizeBytes = maxSize
    ? maxSize * 1024 * 1024
    : (type === "image" ? 5 : 10) * 1024 * 1024;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const validateFile = (file: File) => {
    if (file.size > maxSizeBytes) {
      return `O ficheiro excede o limite de ${maxSize || (type === "image" ? 5 : 10)}MB`;
    }

    if (type === "image" && !file.type.startsWith("image/")) {
      return "Por favor, seleciona um ficheiro de imagem";
    }

    if (type === "document" && file.type !== "application/pdf") {
      return "Por favor, seleciona um documento PDF";
    }

    return null;
  };

  const handleFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];
    const validationError = validateFile(file);

    if (validationError) {
      onValidationError?.(validationError);
      return;
    }

    setSelectedFile(file);
    onFileSelect?.(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (disabled || isUploading) return;

    handleFiles(e.dataTransfer.files);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    onFileRemove?.();
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const openFileDialog = () => {
    if (!disabled && !isUploading) {
      fileInputRef.current?.click();
    }
  };

  const displayFileName = currentFileName || selectedFile?.name;
  const showProgress = isUploading && uploadProgress > 0;

  return (
    <div className="space-y-2">
      <div
        className={cn(
          "relative border-2 border-dashed rounded-lg p-6 transition-all duration-200",
          dragActive && !disabled && !isUploading
            ? "border-primary bg-primary/5"
            : "border-border hover:border-primary/50",
          disabled || isUploading
            ? "opacity-50 cursor-not-allowed"
            : "cursor-pointer",
          error ? "border-destructive bg-destructive/5" : "",
          displayFileName ? "bg-muted/20" : "",
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={acceptTypes}
          onChange={handleFileInputChange}
          className="hidden"
          disabled={disabled || isUploading}
        />

        <div className="flex flex-col items-center justify-center space-y-3 text-center">
          {displayFileName ? (
            <>
              <div
                className={cn(
                  "p-3 rounded-full",
                  isUploading
                    ? "bg-blue-100 text-blue-600"
                    : uploadProgress === 100
                      ? "bg-green-100 text-green-600"
                      : "bg-muted",
                )}
              >
                {isUploading ? (
                  <Upload className="h-6 w-6 animate-pulse" />
                ) : uploadProgress === 100 ? (
                  <Check className="h-6 w-6" />
                ) : (
                  <Icon className="h-6 w-6" />
                )}
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground truncate max-w-[200px]">
                  {displayFileName}
                </p>

                {isUploading && (
                  <p className="text-xs text-muted-foreground">
                    A enviar... {uploadProgress}%
                  </p>
                )}

                {uploadProgress === 100 && !isUploading && (
                  <p className="text-xs text-green-600">Envio concluído</p>
                )}
              </div>

              {!isUploading && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveFile();
                  }}
                  className="mt-2"
                >
                  <X className="h-3 w-3 mr-1" />
                  Remover
                </Button>
              )}
            </>
          ) : (
            <>
              <div className="p-3 bg-muted rounded-full">
                <Icon className="h-6 w-6 text-muted-foreground" />
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium">
                  {type === "image"
                    ? "Enviar uma fotografia"
                    : "Enviar o teu CV"}
                </p>
                <p className="text-xs text-muted-foreground">
                  Arrasta e larga ou clica para procurar
                </p>
                <p className="text-xs text-muted-foreground">
                  {type === "image"
                    ? `Máx ${maxSize || 5}MB • JPG, PNG, WebP, GIF`
                    : `Máx ${maxSize || 10}MB • Apenas PDF`}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Progress bar */}
        {showProgress && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted rounded-b-lg overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300 ease-out"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {/* Required indicator */}
      {required && !displayFileName && (
        <p className="text-xs text-muted-foreground">
          * Este campo é obrigatório
        </p>
      )}
    </div>
  );
}
