import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  FileText, 
  Headphones,
  Settings,
  LogOut,
  ChevronRight,
  Activity
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";

const mainItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Monitoring", url: "/monitoring", icon: Activity },
  { title: "Post-Session Analysis", url: "/reports", icon: FileText },
];

const bottomItems = [
  { title: "Settings", url: "/settings", icon: Settings },
  { title: "Log out", url: "/logout", icon: LogOut },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;
  const isCollapsed = state === "collapsed";

  return (
    <Sidebar className={isCollapsed ? "w-20" : "w-64"} collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border py-6 px-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-pastel-lavender flex items-center justify-center">
            <Headphones className="w-4 h-4 text-sidebar-background" />
          </div>
          {!isCollapsed && (
            <span className="text-lg font-bold text-sidebar-foreground">VR Therapy</span>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="px-6 text-xs text-sidebar-foreground/60 uppercase tracking-wider">
            {!isCollapsed && "General"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    asChild
                    className={`px-6 py-3 ${isActive(item.url) ? 'bg-sidebar-accent text-sidebar-foreground' : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50'}`}
                  >
                    <NavLink to={item.url}>
                      <item.icon className="w-5 h-5" />
                      {!isCollapsed && <span className="ml-3">{item.title}</span>}
                      {!isCollapsed && isActive(item.url) && (
                        <ChevronRight className="w-4 h-4 ml-auto" />
                      )}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarMenu>
          {bottomItems.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton 
                asChild
                className="px-6 py-3 text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
              >
                <NavLink to={item.url}>
                  <item.icon className="w-5 h-5" />
                  {!isCollapsed && <span className="ml-3">{item.title}</span>}
                </NavLink>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
