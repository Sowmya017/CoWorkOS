"use client"
import { useState } from "react"
import { Save, Bell, Shield, Building2, Palette, Globe } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/contexts/AuthContext"
import { useToast } from "@/components/ui/use-toast"

const sections = [
  { id: "profile", label: "Profile", icon: Building2 },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Security", icon: Shield },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "system", label: "System", icon: Globe },
]

export default function SettingsPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [activeSection, setActiveSection] = useState("profile")
  const [profile, setProfile] = useState({ name: user?.name || "", email: user?.email || "", phone: "", bio: "" })
  const [notifications, setNotifications] = useState({ bookings: true, invoices: true, tickets: true, leads: false, visitors: true })
  const [passwords, setPasswords] = useState({ current: "", new_pass: "", confirm: "" })
  const [appearance, setAppearance] = useState({ theme: "light", language: "en", timezone: "Asia/Kolkata", dateFormat: "DD/MM/YYYY" })

  const handleSave = () => {
    toast({ title: "Settings saved!", description: "Your preferences have been updated." })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
        <p className="text-gray-500 text-sm">Manage your account preferences and system configuration</p>
      </div>

      <div className="flex gap-6">
        {/* Sidebar nav */}
        <div className="w-52 flex-shrink-0">
          <div className="bg-white rounded-xl border border-gray-100 p-2 shadow-sm">
            {sections.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  activeSection === s.id ? "bg-blue-50 text-blue-700" : "text-gray-600 hover:bg-gray-50"
                }`}
              >
                <s.icon className="w-4 h-4" />
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 space-y-4">
          {activeSection === "profile" && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Profile Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 pb-4 border-b border-gray-100">
                  <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-white text-2xl font-bold">
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{user?.name}</p>
                    <p className="text-sm text-gray-500">{user?.email}</p>
                    <Badge variant="info" className="mt-1 text-xs capitalize">{user?.role?.replace(/_/g, " ")}</Badge>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input placeholder="+91 98765 43210" value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
                  </div>
                  <div className="space-y-2 col-span-2">
                    <Label>Bio</Label>
                    <Input placeholder="A short bio..." value={profile.bio} onChange={(e) => setProfile({ ...profile, bio: e.target.value })} />
                  </div>
                </div>
                <Button onClick={handleSave} className="gap-2"><Save className="w-4 h-4" /> Save Profile</Button>
              </CardContent>
            </Card>
          )}

          {activeSection === "notifications" && (
            <Card>
              <CardHeader><CardTitle className="text-base">Notification Preferences</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(notifications).map(([key, val]) => (
                  <div key={key} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-800 capitalize">{key} alerts</p>
                      <p className="text-xs text-gray-400">Receive notifications for {key} activity</p>
                    </div>
                    <button
                      onClick={() => setNotifications({ ...notifications, [key]: !val })}
                      className={`relative w-11 h-6 rounded-full transition-colors ${val ? "bg-blue-600" : "bg-gray-200"}`}
                    >
                      <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${val ? "translate-x-5" : "translate-x-0.5"}`} />
                    </button>
                  </div>
                ))}
                <Button onClick={handleSave} className="gap-2 mt-2"><Save className="w-4 h-4" /> Save Preferences</Button>
              </CardContent>
            </Card>
          )}

          {activeSection === "security" && (
            <Card>
              <CardHeader><CardTitle className="text-base">Change Password</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Current Password</Label>
                  <Input type="password" value={passwords.current} onChange={(e) => setPasswords({ ...passwords, current: e.target.value })} placeholder="••••••••" />
                </div>
                <div className="space-y-2">
                  <Label>New Password</Label>
                  <Input type="password" value={passwords.new_pass} onChange={(e) => setPasswords({ ...passwords, new_pass: e.target.value })} placeholder="Min. 8 characters" />
                </div>
                <div className="space-y-2">
                  <Label>Confirm New Password</Label>
                  <Input type="password" value={passwords.confirm} onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })} placeholder="••••••••" />
                </div>
                <Button onClick={handleSave} className="gap-2"><Save className="w-4 h-4" /> Update Password</Button>
              </CardContent>
            </Card>
          )}

          {activeSection === "appearance" && (
            <Card>
              <CardHeader><CardTitle className="text-base">Appearance & Locale</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Theme</Label>
                    <Select value={appearance.theme} onValueChange={(v) => setAppearance({ ...appearance, theme: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="system">System</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Language</Label>
                    <Select value={appearance.language} onValueChange={(v) => setAppearance({ ...appearance, language: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="hi">Hindi</SelectItem>
                        <SelectItem value="ta">Tamil</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Timezone</Label>
                    <Select value={appearance.timezone} onValueChange={(v) => setAppearance({ ...appearance, timezone: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Asia/Kolkata">IST (India)</SelectItem>
                        <SelectItem value="Asia/Dubai">GST (Dubai)</SelectItem>
                        <SelectItem value="UTC">UTC</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Date Format</Label>
                    <Select value={appearance.dateFormat} onValueChange={(v) => setAppearance({ ...appearance, dateFormat: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                        <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                        <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={handleSave} className="gap-2"><Save className="w-4 h-4" /> Save Appearance</Button>
              </CardContent>
            </Card>
          )}

          {activeSection === "system" && (
            <Card>
              <CardHeader><CardTitle className="text-base">System Information</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { label: "Platform", value: "CoWorkOS v1.0.0" },
                    { label: "API Version", value: "v1 (FastAPI)" },
                    { label: "Database", value: "PostgreSQL 16" },
                    { label: "Environment", value: "Production" },
                    { label: "Last Login", value: new Date().toLocaleString("en-IN") },
                    { label: "Session Expires", value: "7 days" },
                  ].map((item) => (
                    <div key={item.label} className="flex justify-between py-2.5 border-b border-gray-50 last:border-0">
                      <span className="text-sm text-gray-500">{item.label}</span>
                      <span className="text-sm font-medium text-gray-800">{item.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
