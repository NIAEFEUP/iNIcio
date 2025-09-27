import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
  HeadObjectCommand,
} from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { v4 as uuidv4 } from "uuid";

const s3Config = {
  endpoint: process.env.S3_ENDPOINT || "http://localhost:9000",
  region: process.env.S3_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || "inicio",
    secretAccessKey: process.env.S3_SECRET_KEY || "inicio123",
  },
  forcePathStyle: true, // Required for MinIO
};

const s3Client = new S3Client(s3Config);
const BUCKET_NAME = process.env.S3_BUCKET || "inicio";

const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];
const ALLOWED_DOCUMENT_TYPES = ["application/pdf"];

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024; // 10MB

export interface UploadResult {
  success: boolean;
  fileName?: string;
  url?: string;
  error?: string;
}

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
}

export function validateFile(
  file: File,
  type: "image" | "document",
): FileValidationResult {
  const allowedTypes =
    type === "image" ? ALLOWED_IMAGE_TYPES : ALLOWED_DOCUMENT_TYPES;
  const maxSize = type === "image" ? MAX_IMAGE_SIZE : MAX_DOCUMENT_SIZE;

  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: `Invalid file type. Allowed types: ${allowedTypes.join(", ")}`,
    };
  }

  if (file.size > maxSize) {
    const maxSizeMB = maxSize / (1024 * 1024);
    return {
      isValid: false,
      error: `File size exceeds ${maxSizeMB}MB limit`,
    };
  }

  return { isValid: true };
}

export function generateFileName(
  originalName: string,
  prefix: string = "",
): string {
  const extension = getFileExtension(originalName);
  const uniqueId = uuidv4();
  return prefix
    ? `${prefix}/${uniqueId}.${extension}`
    : `${uniqueId}.${extension}`;
}

export async function uploadFile(
  file: File | Buffer,
  fileName: string,
  contentType?: string,
): Promise<UploadResult> {
  try {
    const fileBuffer =
      file instanceof File ? Buffer.from(await file.arrayBuffer()) : file;
    const mimeType =
      contentType ||
      (file instanceof File ? file.type : "application/octet-stream");

    const upload = new Upload({
      client: s3Client,
      params: {
        Bucket: BUCKET_NAME,
        Key: fileName,
        Body: fileBuffer,
        ContentType: mimeType,
      },
    });

    await upload.done();

    const url = `${s3Config.endpoint}/${BUCKET_NAME}/${fileName}`;

    return {
      success: true,
      fileName,
      url,
    };
  } catch (error) {
    console.error("File upload error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Upload failed",
    };
  }
}

export async function uploadProfileImage(
  file: File,
  userId: string,
): Promise<UploadResult> {
  // Validate file
  const validation = validateFile(file, "image");
  if (!validation.isValid) {
    return {
      success: false,
      error: validation.error,
    };
  }

  const fileName = generateFileName(file.name, `profiles/${userId}`);

  return uploadFile(file, fileName);
}

export async function uploadCV(
  file: File,
  userId: string,
): Promise<UploadResult> {
  // Validate file
  const validation = validateFile(file, "document");
  if (!validation.isValid) {
    return {
      success: false,
      error: validation.error,
    };
  }

  const fileName = generateFileName(file.name, `cvs/${userId}`);

  return uploadFile(file, fileName);
}

export async function deleteFile(fileName: string): Promise<boolean> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileName,
    });

    await s3Client.send(command);
    return true;
  } catch (error) {
    console.error("File deletion error:", error);
    return false;
  }
}

export async function fileExists(fileName: string): Promise<boolean> {
  try {
    const command = new HeadObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileName,
    });

    await s3Client.send(command);
    return true;
  } catch (error) {
    return false;
  }
}

export function getPublicUrl(fileName: string): string {
  return `${s3Config.endpoint}/${BUCKET_NAME}/${fileName}`;
}

export async function replaceFile(
  newFile: File,
  oldFileName: string,
  newFileName?: string,
): Promise<UploadResult> {
  try {
    const fileName = newFileName || oldFileName;
    const uploadResult = await uploadFile(newFile, fileName);

    // Delete old file if names are different
    if (uploadResult.success && oldFileName !== fileName) {
      await deleteFile(oldFileName);
    }

    return uploadResult;
  } catch (error) {
    console.error("File replacement error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "File replacement failed",
    };
  }
}

export function extractFileNameFromUrl(url: string): string {
  const parts = url.split("/");
  return parts[parts.length - 1];
}

export function getFileExtension(fileName: string): string {
  return fileName.split(".").pop()?.toLowerCase() || "";
}

export async function uploadMultipleFiles(
  files: File[],
  prefix: string = "",
): Promise<UploadResult[]> {
  const uploadPromises = files.map((file) => {
    const fileName = generateFileName(file.name, prefix);
    return uploadFile(file, fileName);
  });

  return Promise.all(uploadPromises);
}

export async function cleanupOldFiles(fileNames: string[]): Promise<number> {
  let deletedCount = 0;

  for (const fileName of fileNames) {
    const deleted = await deleteFile(fileName);
    if (deleted) {
      deletedCount++;
    }
  }

  return deletedCount;
}

export { s3Client };
