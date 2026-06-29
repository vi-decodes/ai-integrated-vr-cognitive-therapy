import { DashboardLayout } from "@/components/Layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { User, Bell, Lock, Palette, Database, Download, FileText, Trash2 } from "lucide-react";

export default function Settings() {
  return (
    <DashboardLayout>
      <div className="p-8 space-y-6">
        <h1 className="text-3xl font-bold text-foreground">Settings</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Settings */}
          <Card className="lg:col-span-2 bg-card border-0 shadow-[0px_4px_15px_rgba(0,0,0,0.08)] rounded-3xl">
            <CardHeader>
              <div className="flex items-center gap-2">
                <User className="w-5 h-5 text-foreground" />
                <CardTitle className="text-xl font-bold text-foreground">Profile Settings</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" defaultValue="Dr. Olivia" className="rounded-2xl" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" defaultValue="Thompson" className="rounded-2xl" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input id="email" type="email" defaultValue="dr.thompson@vrtherapy.com" className="rounded-2xl" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" defaultValue="+1 (555) 123-4567" className="rounded-2xl" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="specialty">Specialty</Label>
                <Input id="specialty" defaultValue="Clinical Psychology" className="rounded-2xl" />
              </div>

              <Button className="rounded-2xl bg-primary text-primary-foreground">
                Save Changes
              </Button>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <div className="space-y-6">
            <Card className="bg-pastel-blue border-0 shadow-[0px_4px_15px_rgba(0,0,0,0.08)] rounded-3xl">
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground mb-1">Account Type</p>
                <p className="text-2xl font-bold text-foreground">Professional</p>
              </CardContent>
            </Card>

            <Card className="bg-pastel-mint border-0 shadow-[0px_4px_15px_rgba(0,0,0,0.08)] rounded-3xl">
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground mb-1">Member Since</p>
                <p className="text-2xl font-bold text-foreground">Aug 2024</p>
              </CardContent>
            </Card>

            <Card className="bg-pastel-yellow border-0 shadow-[0px_4px_15px_rgba(0,0,0,0.08)] rounded-3xl">
              <CardContent className="p-6">
                <p className="text-sm text-muted-foreground mb-1">License ID</p>
                <p className="text-2xl font-bold text-foreground">#CP-8392</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Notification Settings */}
        <Card className="bg-card border-0 shadow-[0px_4px_15px_rgba(0,0,0,0.08)] rounded-3xl">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-foreground" />
              <CardTitle className="text-xl font-bold text-foreground">Notification Preferences</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Email Notifications</p>
                <p className="text-sm text-muted-foreground">Receive updates about patient sessions</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Session Reminders</p>
                <p className="text-sm text-muted-foreground">Get notified 15 minutes before sessions</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Critical Alerts</p>
                <p className="text-sm text-muted-foreground">Immediate alerts for high-stress events</p>
              </div>
              <Switch defaultChecked />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Weekly Reports</p>
                <p className="text-sm text-muted-foreground">Summary of patient progress</p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>

        {/* Security Settings */}
        <Card className="bg-card border-0 shadow-[0px_4px_15px_rgba(0,0,0,0.08)] rounded-3xl">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lock className="w-5 h-5 text-foreground" />
              <CardTitle className="text-xl font-bold text-foreground">Security & Authentication</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Two-Factor Authentication</p>
                <p className="text-sm text-muted-foreground">Add an extra layer of security to your account</p>
              </div>
              <Button variant="outline" className="rounded-2xl">Enable</Button>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Change Password</p>
                <p className="text-sm text-muted-foreground">Update your account credentials</p>
              </div>
              <Button variant="outline" className="rounded-2xl">Change</Button>
            </div>
          </CardContent>
        </Card>

        {/* Clinical Data Management */}
        <Card className="bg-card border-0 shadow-[0px_4px_15px_rgba(0,0,0,0.08)] rounded-3xl">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Database className="w-5 h-5 text-foreground" />
              <CardTitle className="text-xl font-bold text-foreground">Clinical Data Management</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Export Session Data</p>
                <p className="text-sm text-muted-foreground">Download all session records as a structured CSV file</p>
              </div>
              <Button variant="outline" className="rounded-2xl gap-2">
                <Download className="w-4 h-4" /> Export
              </Button>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Download Reports</p>
                <p className="text-sm text-muted-foreground">Generate and download post-session analysis reports as PDF</p>
              </div>
              <Button variant="outline" className="rounded-2xl gap-2">
                <FileText className="w-4 h-4" /> Download
              </Button>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Clear Local Cache</p>
                <p className="text-sm text-muted-foreground">Remove locally stored session data and inference logs from this device</p>
              </div>
              <Button variant="outline" className="rounded-2xl gap-2 border-red-200 text-red-600 hover:bg-red-50">
                <Trash2 className="w-4 h-4" /> Clear
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Appearance Settings */}
        <Card className="bg-card border-0 shadow-[0px_4px_15px_rgba(0,0,0,0.08)] rounded-3xl">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Palette className="w-5 h-5 text-foreground" />
              <CardTitle className="text-xl font-bold text-foreground">Appearance</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Dark Mode</p>
                <p className="text-sm text-muted-foreground">Switch to dark theme for low-light environments</p>
              </div>
              <Switch />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Compact Dashboard</p>
                <p className="text-sm text-muted-foreground">Reduce card spacing for higher information density</p>
              </div>
              <Switch />
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
