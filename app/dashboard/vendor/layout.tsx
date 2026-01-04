import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Vendor Dashboard - RedStore",
  description: "Manage your vendor account and products",
};

export default function VendorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>
}

