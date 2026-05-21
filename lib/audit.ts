import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

interface AuditParams {
  actorUserId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  oldValue?: object;
  newValue?: object;
}

export async function createAuditLog(params: AuditParams) {
  try {
    const headersList = headers();
    const ip = headersList.get("x-forwarded-for") ?? headersList.get("x-real-ip") ?? undefined;
    const ua = headersList.get("user-agent") ?? undefined;

    await prisma.auditLog.create({
      data: {
        actorUserId: params.actorUserId,
        action: params.action,
        entityType: params.entityType,
        entityId: params.entityId,
        oldValue: params.oldValue ? params.oldValue : undefined,
        newValue: params.newValue ? params.newValue : undefined,
        ipAddress: ip,
        userAgent: ua,
      },
    });
  } catch {
    // audit log failure should not break the main flow
  }
}
