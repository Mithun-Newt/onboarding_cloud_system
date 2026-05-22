"use server";

import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import { createAuditLog } from "@/lib/audit";
import { revalidatePath } from "next/cache";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { DocumentStatus } from "@prisma/client";
import { getRestrictionForDocumentType } from "@/lib/document-restrictions";

const MAX_SIZE_MB = parseInt(process.env.MAX_FILE_SIZE_MB ?? "10");

export async function uploadDocument(formData: FormData) {
  const session = await requireAuth();
  const file = formData.get("file") as File;
  const studentId = formData.get("studentId") as string;
  const documentTypeId = formData.get("documentTypeId") as string;

  if (!file || !studentId || !documentTypeId) throw new Error("Missing required fields");
  if (file.size > MAX_SIZE_MB * 1024 * 1024) throw new Error(`File must be under ${MAX_SIZE_MB}MB`);

  const dt =
    (await prisma.documentType.findUnique({ where: { id: documentTypeId } })) ??
    (await prisma.documentType.findUnique({ where: { name: documentTypeId } }));
  if (!dt) {
    throw new Error("Invalid document type. Create it in Settings → Document Types and select it here.");
  }

  const restriction = getRestrictionForDocumentType(dt.name);
  const ext = file.name.split(".").pop()?.toLowerCase();

  if (!ext || !restriction.allowedExtensions.includes(`.${ext}`)) {
    throw new Error(`Invalid file extension. ${restriction.description}`);
  }

  if (!restriction.allowedMimeTypes.includes(file.type)) {
    throw new Error(`Invalid file type. ${restriction.description}`);
  }

  const uploadDir = path.join(process.cwd(), "storage", "uploads", studentId);
  await mkdir(uploadDir, { recursive: true });

  const safeName = `${dt.id}-${Date.now()}.${ext}`;
  const filePath = path.join(uploadDir, safeName);
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(filePath, buffer);

  const relativePath = path.join("storage", "uploads", studentId, safeName);

  const existing = await prisma.studentDocument.findFirst({
    where: { studentId, documentTypeId: dt.id },
  });

  let doc;
  if (existing) {
    doc = await prisma.studentDocument.update({
      where: { id: existing.id },
      data: {
        status: DocumentStatus.UPLOADED,
        filePath: relativePath,
        originalFilename: file.name,
        mimeType: file.type,
        fileSizeBytes: file.size,
        uploadedByUserId: session.user.id,
        verifiedAt: null,
        rejectedAt: null,
        remarks: null,
      },
    });
  } else {
    doc = await prisma.studentDocument.create({
      data: {
        studentId,
        documentTypeId: dt.id,
        status: DocumentStatus.UPLOADED,
        filePath: relativePath,
        originalFilename: file.name,
        mimeType: file.type,
        fileSizeBytes: file.size,
        uploadedByUserId: session.user.id,
      },
    });
  }

  await createAuditLog({
    actorUserId: session.user.id,
    action: "UPLOAD_DOCUMENT",
    entityType: "StudentDocument",
    entityId: doc.id,
    newValue: { documentTypeId: dt.id, documentTypeName: dt.name, filename: file.name },
  });

  revalidatePath("/documents");
  return doc;
}

export async function updateDocumentStatus(
  documentId: string,
  status: DocumentStatus,
  remarks?: string,
  waiverReason?: string
) {
  const session = await requireAuth();
  const doc = await prisma.studentDocument.findUnique({ where: { id: documentId } });
  if (!doc) throw new Error("Document not found");

  if (status === DocumentStatus.REJECTED && !remarks) {
    throw new Error("Rejection reason is required");
  }
  if (status === DocumentStatus.WAIVED && !waiverReason) {
    throw new Error("Waiver reason is required");
  }

  await prisma.studentDocument.update({
    where: { id: documentId },
    data: {
      status,
      verifiedByUserId: status === DocumentStatus.VERIFIED ? session.user.id : undefined,
      verifiedAt: status === DocumentStatus.VERIFIED ? new Date() : undefined,
      rejectedAt: status === DocumentStatus.REJECTED ? new Date() : undefined,
      remarks: remarks,
      waiverReason: waiverReason,
    },
  });

  await createAuditLog({
    actorUserId: session.user.id,
    action: `DOCUMENT_${status}`,
    entityType: "StudentDocument",
    entityId: documentId,
    newValue: { status, remarks, waiverReason },
  });

  revalidatePath("/documents");
}

export async function getPendingDocuments() {
  return prisma.studentDocument.findMany({
    where: { status: { in: [DocumentStatus.NOT_RECEIVED, DocumentStatus.UPLOADED] } },
    include: {
      student: { select: { fullNameEn: true } },
      documentType: true,
    },
    orderBy: { createdAt: "desc" },
  });
}
