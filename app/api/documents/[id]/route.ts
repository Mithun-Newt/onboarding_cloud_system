import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Authenticate user (staff portal check)
    const session = await requireAuth();
    if (!session) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // 2. Fetch the document record
    const docId = params.id;
    const document = await prisma.studentDocument.findUnique({
      where: { id: docId },
    });

    if (!document || !document.filePath) {
      return new NextResponse("Document not found", { status: 404 });
    }

    // 3. Read the file from local storage
    const fullPath = path.join(process.cwd(), document.filePath);
    try {
      const fileBuffer = await readFile(fullPath);
      
      const headers = new Headers();
      headers.set("Content-Type", document.mimeType || "application/octet-stream");
      
      // Inline content-disposition displays it in browser directly rather than downloading it automatically.
      const safeFilename = encodeURIComponent(document.originalFilename || "document");
      headers.set("Content-Disposition", `inline; filename="${safeFilename}"`);
      
      return new NextResponse(fileBuffer, { headers });
    } catch (e) {
      return new NextResponse("File not found on disk", { status: 404 });
    }
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}
