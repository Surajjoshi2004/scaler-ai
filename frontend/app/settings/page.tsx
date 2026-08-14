import { Bell, Shield, User } from "lucide-react";

import Navbar from "../../components/Navbar";
import Sidebar from "../../components/Sidebar";

export default function SettingsPage() {
  // Render the current placeholder settings sections within the shared app shell.
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar title="Settings" />

        <main className="flex-1 overflow-y-auto bg-zinc-50">
          <div className="mx-auto w-full max-w-3xl p-6 lg:p-8">
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">
              Settings
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              Manage your account and workspace preferences.
            </p>

            <section className="mt-6 rounded-xl border border-zinc-200 bg-white p-5">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
                <User className="h-4 w-4 text-violet-600" />
                Profile
              </h2>
              <p className="mt-2 text-sm text-zinc-500">
                Profile settings will appear here.
              </p>
            </section>

            <section className="mt-6 rounded-xl border border-zinc-200 bg-white p-5">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
                <Bell className="h-4 w-4 text-violet-600" />
                Notifications
              </h2>
              <p className="mt-2 text-sm text-zinc-500">
                Notification preferences will appear here.
              </p>
            </section>

            <section className="mt-6 rounded-xl border border-zinc-200 bg-white p-5">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
                <Shield className="h-4 w-4 text-violet-600" />
                Workspace
              </h2>
              <p className="mt-2 text-sm text-zinc-500">
                Workspace settings will appear here.
              </p>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
