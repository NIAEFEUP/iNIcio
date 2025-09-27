import { NextRequest, NextResponse } from "next/server";
import {
  uploadProfileImage,
  uploadCV,
  deleteFile,
  UploadResult,
} from "@/lib/file-upload";
import { auth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;
    const type = formData.get("type") as string; // 'profile' or 'cv'

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!type || !["profile", "cv"].includes(type)) {
      return NextResponse.json(
        { error: 'Invalid upload type. Must be "profile" or "cv"' },
        { status: 400 },
      );
    }

    let result: UploadResult;

    if (type === "profile") {
      result = await uploadProfileImage(file, session.user.id);
    } else {
      result = await uploadCV(file, session.user.id);
    }

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      message: "File uploaded successfully",
      fileName: result.fileName,
      url: result.url,
    });
  } catch (error) {
    console.error("Upload API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const fileName = searchParams.get("fileName");

    if (!fileName) {
      return NextResponse.json(
        { error: "File name is required" },
        { status: 400 },
      );
    }

    // Security check: ensure the file belongs to the user
    const userId = session.user.id;
    if (
      !fileName.includes(`profiles/${userId}`) &&
      !fileName.includes(`cvs/${userId}`)
    ) {
      return NextResponse.json(
        { error: "Unauthorized to delete this file" },
        { status: 403 },
      );
    }

    const success = await deleteFile(fileName);

    if (!success) {
      return NextResponse.json(
        { error: "Failed to delete file" },
        { status: 500 },
      );
    }

    return NextResponse.json({
      message: "File deleted successfully",
    });
  } catch (error) {
    console.error("Delete API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
