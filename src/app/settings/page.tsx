import { Card, SectionHeading } from "@/components/ui";
import { PushNotifications } from "@/components/push-notifications";
import { PushTestActions } from "@/components/push-test-actions";

export default function SettingsPage() {
  return (
    <div className="space-y-8 max-w-2xl">
      <h1 className="font-display text-3xl">Settings</h1>

      <Card className="p-5 space-y-4">
        <SectionHeading title="Notifications" />
        <p className="text-sm text-muted">
          Get a push notification for dates coming up in a week (and again on the day), check-ins that
          are due, memory flashbacks, and events happening soon.
        </p>
        <PushNotifications />
        <div className="border-t border-border pt-4">
          <p className="text-xs text-muted mb-2">
            For testing — in production this runs automatically once a day via a scheduled job.
          </p>
          <PushTestActions />
        </div>
      </Card>
    </div>
  );
}
