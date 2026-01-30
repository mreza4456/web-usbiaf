// app/admin/chat/page.tsx
import AdminChatDashboard from "@/components/chat-admin";
import { SiteHeader } from "@/components/site-header";
import { Card } from "@/components/ui/card";

export default function AdminChatPage() {
  return (
    <div>
      <SiteHeader title="Customers Service" />
    <div className="flex justify-center py-8">
      <Card className="p-0 overflow-hidden h-[85%]  fixed w-full max-w-[80%] mx-auto  mx-auto">
        <AdminChatDashboard />
      </Card>
    </div>
    </div>
  );
}