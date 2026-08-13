"use client"

import * as React from "react"
import {
  IconChartBar,
  IconDashboard,
  IconFileDescription,
  IconFilter,
  IconFolder,
  IconImageInPicture,
  IconInnerShadowTop,
  IconListDetails,
  IconMessage2,
  IconTargetArrow,
  IconTicket,
  IconUsers,
  IconUsersPlus,
} from "@tabler/icons-react"

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Grid, LayoutDashboardIcon } from "lucide-react"

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navGroups: [
    {
      label: "Overview",
      items: [
        { title: "Dashboard", url: "/admin/dashboard", icon: IconDashboard },
      ],
    },
    {
      label: "Produk & Layanan",
      items: [
        { title: "Projects", url: "/admin/products", icon: IconListDetails },
        { title: "Services", url: "/admin/categories", icon: IconChartBar },
        {
          title: "Services Categories",
          url: "/admin/categories/class",
          icon: LayoutDashboardIcon,
        },
      ],
    },
    {
      label: "Transaksi",
      items: [
        { title: "Order", url: "/admin/order", icon: IconFolder },
        { title: "Voucher", url: "/admin/voucher", icon: IconTicket },
        {
          title: "Milestone Rewards",
          url: "/admin/milestone",
          icon: IconTargetArrow,
        },
      ],
    },
    {
      label: "Konten",
      items: [
        { title: "Blog", url: "/admin/blog", icon: IconFileDescription },
        { title: "Posters", url: "/admin/posters", icon: IconImageInPicture },
      ],
    },
    {
      label: "Tim & Pengguna",
      items: [
        { title: "User", url: "/admin/users", icon: IconUsers },
        { title: "Teams", url: "/admin/teams", icon: IconUsersPlus },
        { title: "Chat Customers", url: "/admin/chat", icon: IconMessage2 },
      ],
    },
  ],
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props} className="bg-white">
      <SidebarHeader className="bg-white">
        <SidebarMenu className="bg-white">
          <SidebarMenuItem className="bg-white">
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="#">
                <IconInnerShadowTop className="!size-5" />
                <span className="text-base font-semibold">Nemuneko Studio</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className="bg-white gap-0">
        {data.navGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel className="text-gray-400">{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild tooltip={item.title}>
                      <a href={item.url}>
                        <item.icon className="!size-4" />
                        <span>{item.title}</span>
                      </a>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  )
}