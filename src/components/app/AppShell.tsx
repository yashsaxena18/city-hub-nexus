import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import { Bell, ChevronsLeft, LogOut, Menu, Moon, RefreshCcw, Search, Sun, User as UserIcon, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { CRUMB, HOME_FOR, NAV, ROLE_LABEL } from "@/lib/nav";
import { useStore, visibleNotifications } from "@/lib/store";
import { useTheme } from "@/lib/theme";
import { relTime } from "@/lib/format";
import type { Role } from "@/lib/types";
import { cn } from "@/lib/utils";
import { DemoBadge, Logo, StatusBadge } from "./ui-bits";

export function initials(name: string) {
  return name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

function SidebarNav({ collapsed, onNavigate }: { collapsed: boolean; onNavigate?: () => void }) {
  const { me } = useStore();
  const { pathname } = useLocation();
  const items = NAV.filter((n) => me && n.roles.includes(me.role));
  const groups = ["Operations", "Intelligence", "Administration", "Account"] as const;
  return (
    <nav className="flex-1 space-y-5 overflow-y-auto px-2 py-4" aria-label="Main">
      {groups.map((g) => {
        const list = items.filter((i) => i.group === g);
        if (!list.length) return null;
        return (
          <div key={g}>
            {!collapsed && <div className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-wider text-sidebar-foreground/50">{g}</div>}
            <ul className="space-y-0.5">
              {list.map((item) => {
                const active = pathname === item.to || (item.to !== "/citizen" && pathname.startsWith(item.to + "/"));
                const link = (
                  <Link
                    to={item.to}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-2.5 rounded-md px-2 py-1.5 text-[13px] font-medium transition-colors",
                      active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
                      collapsed && "justify-center",
                    )}
                  >
                    <item.icon className={cn("h-4 w-4 shrink-0", active && "text-sidebar-primary")} />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </Link>
                );
                return (
                  <li key={item.to}>
                    {collapsed ? (
                      <Tooltip>
                        <TooltipTrigger asChild>{link}</TooltipTrigger>
                        <TooltipContent side="right">{item.label}</TooltipContent>
                      </Tooltip>
                    ) : (
                      link
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}

function GlobalSearch({ open, setOpen }: { open: boolean; setOpen: (b: boolean) => void }) {
  const { state, me } = useStore();
  const navigate = useNavigate();
  const list = useMemo(() => (me?.role === "citizen" ? state.incidents.filter((i) => i.reporterId === me.id) : state.incidents), [state.incidents, me]);
  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search by reference, title, category or location…" />
      <CommandList>
        <CommandEmpty>No incidents match your search.</CommandEmpty>
        <CommandGroup heading="Incidents">
          {list.slice(0, 200).map((i) => (
            <CommandItem
              key={i.id}
              value={`${i.ref} ${i.title} ${i.category} ${i.location}`}
              onSelect={() => {
                setOpen(false);
                navigate({ to: "/incidents/$id", params: { id: i.id } });
              }}
            >
              <span className="font-mono text-xs text-muted-foreground">{i.ref}</span>
              <span className="truncate">{i.title}</span>
              <span className="ml-auto hidden truncate text-xs text-muted-foreground sm:inline">{i.location}</span>
              <StatusBadge status={i.status} />
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

function NotificationBell() {
  const { state, me, actions } = useStore();
  const mine = visibleNotifications(state.notifications, me);
  const unread = mine.filter((n) => !n.read);
  const navigate = useNavigate();
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label={`Notifications, ${unread.length} unread`}>
          <Bell className="h-4 w-4" />
          {unread.length > 0 && <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-critical px-1 text-[10px] font-semibold text-primary-foreground">{unread.length}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-3 py-2">
          <span className="text-sm font-semibold">Notifications</span>
          <button className="text-xs text-primary hover:underline disabled:opacity-50" disabled={!unread.length} onClick={() => actions.markAllRead(unread.map((n) => n.id))}>
            Mark all read
          </button>
        </div>
        <ul className="max-h-80 divide-y overflow-y-auto">
          {mine.slice(0, 6).map((n) => (
            <li key={n.id}>
              <button
                className="flex w-full gap-2 px-3 py-2.5 text-left hover:bg-muted"
                onClick={() => {
                  actions.markRead(n.id);
                  if (n.incidentId) navigate({ to: "/incidents/$id", params: { id: n.incidentId } });
                }}
              >
                <span className={cn("mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full", n.read ? "bg-transparent" : "bg-primary")} />
                <span className="min-w-0">
                  <span className="block text-xs font-medium">{n.title}</span>
                  <span className="block truncate text-xs text-muted-foreground">{n.body}</span>
                  <span className="block text-[10px] text-muted-foreground">{relTime(n.at)}</span>
                </span>
              </button>
            </li>
          ))}
          {!mine.length && <li className="px-3 py-6 text-center text-xs text-muted-foreground">You're all caught up.</li>}
        </ul>
        <Link to="/notifications" className="block border-t px-3 py-2 text-center text-xs font-medium text-primary hover:bg-muted">
          View all notifications
        </Link>
      </PopoverContent>
    </Popover>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { me, actions } = useStore();
  const [collapsed, setCollapsed] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [search, setSearch] = useState(false);
  const { theme, toggle } = useTheme();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    setCollapsed(localStorage.getItem("scn-sidebar") === "1");
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearch((s) => !s);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  const toggleCollapse = () => {
    setCollapsed((c) => {
      localStorage.setItem("scn-sidebar", c ? "0" : "1");
      return !c;
    });
  };

  if (!me) return null;
  const segs = pathname.split("/").filter(Boolean);
  const crumbs = segs.map((_, i) => "/" + segs.slice(0, i + 1).join("/"));

  const switchRole = (r: Role) => {
    actions.loginAs(r);
    toast.success(`Switched to demo ${ROLE_LABEL[r]}`);
    navigate({ to: HOME_FOR[r] });
  };

  const sidebarInner = (c: boolean, onNav?: () => void) => (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className={cn("flex h-14 items-center border-b border-sidebar-border px-3", c && "justify-center")}>
        <Link to={HOME_FOR[me.role]} onClick={onNav}>
          {c ? <Logo className="[&>span:last-child]:hidden" /> : <Logo light />}
        </Link>
      </div>
      <SidebarNav collapsed={c} onNavigate={onNav} />
      <div className={cn("border-t border-sidebar-border p-3 text-[11px] text-sidebar-foreground/60", c && "hidden")}>
        <div className="mb-1 font-semibold uppercase tracking-wider text-warning">Demo mode</div>
        Data is simulated and stored only in this browser.
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen">
      <aside className={cn("sticky top-0 hidden h-screen shrink-0 transition-[width] duration-200 lg:block", collapsed ? "w-16" : "w-60")}>{sidebarInner(collapsed)}</aside>
      <Sheet open={mobile} onOpenChange={setMobile}>
        <SheetContent side="left" className="w-64 border-0 p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          {sidebarInner(false, () => setMobile(false))}
        </SheetContent>
      </Sheet>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background/85 px-3 backdrop-blur sm:px-4">
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setMobile(true)} aria-label="Open navigation">
            <Menu className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="hidden lg:inline-flex" onClick={toggleCollapse} aria-label="Toggle sidebar">
            <ChevronsLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
          </Button>
          <nav aria-label="Breadcrumb" className="hidden min-w-0 items-center gap-1.5 text-sm md:flex">
            <Link to={HOME_FOR[me.role]} className="text-muted-foreground hover:text-foreground">Nexus</Link>
            {crumbs.map((c, i) => (
              <span key={c} className="flex min-w-0 items-center gap-1.5">
                <span className="text-muted-foreground/50">/</span>
                {i === crumbs.length - 1 ? (
                  <span className="truncate font-medium">{CRUMB[c] ?? decodeURIComponent(segs[i]).replace(/-/g, " ")}</span>
                ) : (
                  <Link to={c} className="truncate text-muted-foreground hover:text-foreground">{CRUMB[c] ?? segs[i]}</Link>
                )}
              </span>
            ))}
          </nav>
          <div className="flex-1" />
          <button onClick={() => setSearch(true)} className="flex h-8 items-center gap-2 rounded-md border bg-card px-2.5 text-xs text-muted-foreground hover:border-primary/40 sm:w-64">
            <Search className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Search incidents…</span>
            <kbd className="ml-auto hidden rounded border bg-muted px-1 font-mono text-[10px] sm:inline">⌘K</kbd>
          </button>
          <DemoBadge />
          <NotificationBell />
          <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme">
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-2 rounded-md p-1 hover:bg-muted" aria-label="Account menu">
              <Avatar className="h-7 w-7">
                <AvatarFallback className="bg-primary/15 text-[11px] font-semibold text-primary">{initials(me.name)}</AvatarFallback>
              </Avatar>
              <span className="hidden text-left leading-tight xl:block">
                <span className="block text-xs font-medium">{me.name}</span>
                <span className="block text-[10px] text-muted-foreground">{ROLE_LABEL[me.role]}</span>
              </span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="text-sm">{me.name}</div>
                <div className="text-xs font-normal text-muted-foreground">{me.email}</div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate({ to: "/settings" })}><UserIcon className="h-4 w-4" />Profile & settings</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">Switch demo role</DropdownMenuLabel>
              {(Object.keys(ROLE_LABEL) as Role[]).map((r) => (
                <DropdownMenuItem key={r} onClick={() => switchRole(r)} disabled={me.role === r}>
                  <Users className="h-4 w-4" />
                  {ROLE_LABEL[r]}
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => { actions.resetDemo(); toast.success("Demo data reset"); }}><RefreshCcw className="h-4 w-4" />Reset demo data</DropdownMenuItem>
              <DropdownMenuItem onClick={() => { actions.logout(); navigate({ to: "/login" }); toast("Signed out"); }}><LogOut className="h-4 w-4" />Log out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
      <GlobalSearch open={search} setOpen={setSearch} />
    </div>
  );
}
