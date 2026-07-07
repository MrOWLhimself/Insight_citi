import type { Metadata } from "next";
import { Dashboard } from "@/components/dashboard/Dashboard";

// Private, per-account workspace: never indexed, and excluded via robots.ts too.
export const metadata: Metadata = {
  title: "Writer dashboard",
  robots: { index: false, follow: false }
};

export default function DashboardPage() {
  return <Dashboard />;
}
