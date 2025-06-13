import React from "react";
import { Layout } from "@/components/layout/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings as SettingsIcon } from "lucide-react";

export default function Settings() {
  return (
    <Layout>
      <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-3xl font-bold tracking-tight">Settings</h2>
        </div>

        <Card className="w-full max-w-2xl mx-auto">
          <CardHeader>
            <div className="flex items-center gap-3">
              <SettingsIcon className="h-8 w-8 text-muted-foreground" />
              <div>
                <CardTitle>Settings Under Development</CardTitle>
                <CardDescription>
                  We're working hard to bring you customizable settings soon.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              Our team is currently developing comprehensive settings options to give you more control over your experience.
              Check back soon for features like:
            </p>
            <ul className="list-disc list-inside space-y-2 text-muted-foreground pl-4">
              <li>Profile customization</li>
              <li>Notification preferences</li>
              <li>Display settings</li>
              <li>Security options</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
