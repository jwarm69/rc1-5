/**
 * RealCoach.ai - Settings Page
 *
 * User settings including Mailchimp integration.
 */

import { MailchimpConnection } from "@/components/settings/MailchimpConnection";

export default function Settings() {
  return (
    <div className="animate-fade-in min-h-screen">
      <div className="mb-6 md:mb-8">
        <h1 className="text-lg font-medium text-foreground/90">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground/50">
          Manage your account and integrations.
        </p>
      </div>

      <div className="space-y-8">
        {/* Email Marketing Section */}
        <section>
          <h2 className="text-sm font-medium text-muted-foreground mb-4 uppercase tracking-wider">
            Email Marketing
          </h2>
          <MailchimpConnection />
        </section>
      </div>
    </div>
  );
}
