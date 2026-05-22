import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function BackupPage() {
  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-bold">Backup & Restore</h2>
        <p className="text-sm text-muted-foreground">Backup download is not configured in this build.</p>
      </div>

      <div className="rounded-lg border bg-white p-4">
        <div className="space-y-3">
          <div className="text-sm">
            To enable backups, add a secure server-side endpoint that generates a database dump and restrict it to admin users.
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline">
              <Link href="/settings">Back to Settings</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

