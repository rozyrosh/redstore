import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Dashboard - RedStore",
  description: "Admin panel for managing the marketplace",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>
}
