"use client"

import * as React from "react"
import {
  IconCamera,
  IconChartBar,
  IconDashboard,
  IconDatabase,
  IconFileAi,
  IconFileDescription,
  IconFileWord,
  IconFolder,
  IconHelp,
  IconInnerShadowTop,
  IconListDetails,
  IconMessage2,
  IconReport,
  IconSearch,
  IconSettings,
  IconTarget,
  IconTargetArrow,
  IconTicket,
  IconUsers,
  IconUsersPlus,
} from "@tabler/icons-react"


import { NavMain } from "@/components/nav-main"


import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/admin/dashboard",
      icon: IconDashboard,
    },
    {
      title: "Projects",
      url: "/admin/products",
      icon: IconListDetails,
    },
    {
      title: "Services",
      url: "/admin/categories",
      icon: IconChartBar,
    },
    {
      title: "User",
      url: "/admin/users",
      icon: IconUsers,
    },
    {
      title: "Order",
      url: "/admin/order",
      icon: IconFolder,
    },
    {
      title: "Voucher",
      url: "/admin/voucher",
      icon: IconTicket,
    },
    {
      title: "Milestone Rewards",
      url: "/admin/milestone",
      icon: IconTargetArrow,
    },
    {
      title: "Blog",
      url: "/admin/blog",
      icon: IconFileDescription,
    },
    {
      title: "Teams",
      url: "/admin/teams",
      icon: IconUsersPlus,
    },
    {
      title: "Chat Customers",
      url: "/admin/chat",
      icon: IconMessage2,
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
      <SidebarContent className="bg-white">
        <NavMain  items={data.navMain} />

      </SidebarContent>
  
    </Sidebar>
  )
}