import "server-only";

import { validateFile } from "@/lib/file-validate";

import {
  S3Client,
  DeleteObjectCommand,
  HeadObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Upload } from "@aws-sdk/lib-storage";
import { v4 as uuidv4 } from "uuid";
import { db, Application } from "./db";
import { application, user } from "@/db/schema";
import { eq } from "drizzle-orm";
import { isCandidate } from "./candidate";

// Ensure required environment variables are set
if (
  !process.env.S3_ACCESS_KEY ||
  !process.env.S3_SECRET_KEY ||
  !process.env.S3_BUCKET
) {
  throw new Error(
    "Missing required S3 configuration: S3_ACCESS_KEY, S3_SECRET_KEY, and S3_BUCKET must be set in environment variables.",
  );
}

const s3Config = {
  endpoint: process.env.S3_ENDPOINT || "http://localhost:9001",
  region: process.env.S3_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY,
    secretAccessKey: process.env.S3_SECRET_KEY,
  },
  forcePathStyle: true,
};

const s3Client = new S3Client(s3Config);
const BUCKET_NAME = process.env.S3_BUCKET;

export interface UploadResult {
  success: boolean;
  fileName?: string;
  url?: string;
  error?: string;
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
  const validation = validateFile(file, "image");
  if (!validation.isValid) {
    return {
      success: false,
      error: validation.error,
    };
  }

  const fileName = generateFileName(file.name, `profiles/${userId}`);

  await db.transaction(async (tx) => {
    const _user = await tx.query.user
      .findFirst({
        where: eq(user.id, userId),
      })
      .then((user) => user);

    await tx
      .update(user)
      .set({
        image: fileName,
      })
      .where(eq(user.id, _user.id));
  });

  return uploadFile(file, fileName);
}

export async function uploadCV(
  file: File,
  userId: string,
): Promise<UploadResult> {
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
  } catch {
    return false;
  }
}

export function fromFullUrlToPath(url: string) {
  if (url.startsWith("https")) {
    return url.split("/").splice(4).join("/");
  }

  return url;
}

export async function getFilenameUrl(key: string): Promise<string> {
  if (!key) return "";

  const command = new GetObjectCommand({
    Bucket: process.env.S3_BUCKET,
    Key: fromFullUrlToPath(key),
  });

  return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
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
  const lastDot = fileName.lastIndexOf(".");
  if (lastDot > 0 && lastDot < fileName.length - 1) {
    return fileName.substring(lastDot + 1).toLowerCase();
  }
  return "";
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
