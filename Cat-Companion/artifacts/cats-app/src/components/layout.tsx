import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Cat, Menu, BookOpen, BookHeart, Pill, Phone, Utensils, LogIn, LogOut, User, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { useUser, useClerk, Show } from "@clerk/react";
import { useSubscription } from "@/hooks/use-subscription";

interface LayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { name: "My Cats", href: "/", icon: Cat },
  { name: "Feedings", href: "/feedings", icon: Utensils },
  { name: "Baby Books", href: "/baby-books", icon: BookHeart },
  { name: "Medications", href: "/medications", icon: Pill },
  { name: "Vets", href: "/vets", icon: Phone },
  { name: "Care Guides", href: "/guides", icon: BookOpen },
];

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, isSignedIn, isLoaded } = useUser();
  const { signOut } = useClerk();
  const { isPlus } = useSubscription();

  const NavLinks = ({ onNavigate }: { onNavigate?: () => void }) => (
    <div className="flex flex-col space-y-1">
      {navItems.map((item) => {
        const isActive =
          location === item.href ||
          (item.href !== "/" && location.startsWith(item.href));
        const Icon = item.icon;

        return (
          <Link key={item.href} href={item.href} onClick={onNavigate}>
            <span
              className={cn(
                "flex items-center space-x-3 rounded-lg px-3 py-2 text-sm font-medium transition-all hover:text-primary cursor-pointer",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted"
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span>{item.name}</span>
            </span>
          </Link>
        );
      })}
    </div>
  );

  const UserSection = ({ onNavigate }: { onNavigate?: () => void }) => (
    <div className="border-t border-border/50 pt-4 mt-2 space-y-2">
      {isLoaded && isSignedIn ? (
        <>
          {!isPlus && (
            <Link href="/pricing" onClick={onNavigate}>
              <button className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold bg-primary/10 text-primary hover:bg-primary/15 transition-colors">
                <Sparkles className="h-4 w-4 shrink-0" />
                Upgrade to Plus
              </button>
            </Link>
          )}
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-muted/40">
            <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
              {user?.imageUrl ? (
                <img src={user.imageUrl} alt={user.firstName ?? "User"} className="w-7 h-7 rounded-full object-cover" />
              ) : (
                <User className="w-4 h-4 text-primary" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {user?.firstName ?? user?.emailAddresses?.[0]?.emailAddress ?? "Account"}
              </p>
              <p className="text-xs text-muted-foreground">
                {isPlus ? "Loafing Plus" : "Free plan"}
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground shrink-0"
              onClick={() => signOut()}
              title="Sign out"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </>
      ) : isLoaded ? (
        <Link href="/sign-in" onClick={onNavigate}>
          <button className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:text-primary hover:bg-muted transition-colors">
            <LogIn className="h-5 w-5" />
            Sign in
          </button>
        </Link>
      ) : null}
    </div>
  );

  return (
    <div className="flex min-h-[100dvh] w-full bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden w-64 flex-col border-r border-border bg-card md:flex">
        <div className="flex h-16 items-center px-6 border-b border-border/50">
          <Link href="/">
            <div className="flex items-center gap-2 text-primary font-bold text-xl cursor-pointer">
              <Cat className="h-6 w-6" />
              <span>Loafing</span>
            </div>
          </Link>
        </div>
        <div className="flex-1 overflow-auto py-6 px-4">
          <NavLinks />
        </div>
        <div className="px-4 pb-6">
          <UserSection />
        </div>
      </aside>

      {/* Mobile Nav */}
      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center gap-4 border-b border-border bg-card px-4 md:hidden">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 bg-card p-0 flex flex-col">
              <div className="flex h-16 items-center px-6 border-b border-border/50 shrink-0">
                <div className="flex items-center gap-2 text-primary font-bold text-xl">
                  <Cat className="h-6 w-6" />
                  <span>Loafing</span>
                </div>
              </div>
              <div className="flex-1 overflow-auto p-4">
                <NavLinks onNavigate={() => setMobileOpen(false)} />
              </div>
              <div className="px-4 pb-6 shrink-0">
                <UserSection onNavigate={() => setMobileOpen(false)} />
              </div>
            </SheetContent>
          </Sheet>
          <div className="flex items-center gap-2 text-primary font-bold text-lg md:hidden">
            <Cat className="h-5 w-5" />
            <span>Loafing</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Show when="signed-out">
              <Link href="/sign-in">
                <Button variant="ghost" size="sm" className="text-muted-foreground">
                  Sign in
                </Button>
              </Link>
            </Show>
            <Show when="signed-in">
              {!isPlus && (
                <Link href="/pricing">
                  <Button size="sm" className="gap-1.5 h-8">
                    <Sparkles className="h-3.5 w-3.5" />
                    Upgrade
                  </Button>
                </Link>
              )}
            </Show>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 md:p-8 animate-in fade-in duration-500">
          <div className="mx-auto max-w-5xl">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
