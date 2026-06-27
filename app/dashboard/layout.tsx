import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Telemetry Dashboard | Project Zenith",
  description: "Real-time ISS tracking, pass predictions, visible planets, observation conditions, and cosmic twin score for your location.",
  openGraph: {
    title: "Telemetry Dashboard | Project Zenith",
    description: "Real-time ISS tracking and space telemetry for any coordinate on Earth.",
  },
};

export default function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
