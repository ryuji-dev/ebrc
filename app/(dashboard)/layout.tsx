'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';
import {
  ChartColumnStacked,
  Book,
  BookOpen,
  User,
  Shield,
  LogOut,
  Menu,
  X,
  BookOpenText
} from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const [userEmail, setUserEmail] = useState('');
  const [userRole, setUserRole] = useState<'user' | 'leader' | 'admin'>('user');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    async function loadUser() {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      // 사용자 상세 프로필 조회 (역할 및 잠금 상태 확인)
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('role, is_locked, first_login, email')
        .eq('id', user.id)
        .single() as { data: { role: 'user' | 'leader' | 'admin'; is_locked: boolean; first_login: boolean; email: string } | null };

      if (profile?.is_locked) {
        await supabase.auth.signOut();
        router.push('/login');
        return;
      }

      if (profile?.first_login) {
        router.push('/change-password');
        return;
      }

      setUserEmail(profile?.email || user.email || '');
      setUserRole(profile?.role || 'user');
    }

    loadUser();
  }, [router, supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const navigation = [
    { name: '대시보드', href: '/dashboard', icon: ChartColumnStacked },
    { name: '경건시간', href: '/devotion', icon: Book },
    { name: '성경통독', href: '/reading', icon: BookOpen },
    { name: '프로필', href: '/profile', icon: User },
  ];

  if (userRole === 'admin' || userRole === 'leader') {
    navigation.push({ name: '관리자', href: '/admin', icon: Shield });
  }

  return (
    <div className="min-h-screen bg-mesh text-foreground flex overflow-hidden">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-md z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed lg:static inset-y-0 left-0 z-50 w-72 glass-dark border-r border-white/5",
        "transform transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]",
        sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-20 px-6">
            <Link href="/dashboard" className="flex items-center gap-4 hover:opacity-80 transition-opacity">
              <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-white shadow-sm">
                <BookOpenText className="w-8 h-8" />
              </div>
              <span className="text-2xl tracking-tighter text-white font-brand">BIBLIAN 365</span>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-muted-foreground hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-4 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              const Icon = item.icon;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "group flex items-center gap-4 px-4 py-3 rounded-2xl text-sm transition-all duration-300 relative overflow-hidden",
                    isActive
                      ? "bg-primary text-white"
                      : "text-muted-foreground hover:bg-white/5 hover:text-white"
                  )}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className="w-5 h-5" />
                  {item.name}
                  {isActive && (
                    <div className="absolute left-0 top-1/4 bottom-1/4 w-1 bg-white rounded-r-full" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User info */}
          <div className="p-4">
            <div className="glass-dark rounded-3xl p-4 border-white/5 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center text-sm text-primary">
                  {userRole === 'admin' ? 'P' : userRole === 'leader' ? 'L' : 'M'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-white/90 truncate">{userEmail}</div>
                  <div className="text-[10px] tracking-wider text-muted-foreground uppercase">
                    {userRole === 'admin' && 'Pastor'}
                    {userRole === 'leader' && 'Leader'}
                    {userRole === 'user' && 'Member'}
                  </div>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center justify-center gap-2 text-xs text-muted-foreground hover:text-rose-500 transition-all duration-300 w-full py-3 rounded-xl hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20"
              >
                <LogOut className="w-4 h-4" />
                SIGN OUT
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Decorative background light */}
        <div className="absolute top-[-10%] right-[-5%] w-[30%] h-[30%] bg-primary/10 blur-[100px] rounded-full -z-10" />

        {/* Header (Top Nav) */}
        <header className="h-16 lg:h-6 px-8 flex items-center justify-between lg:justify-end sticky top-0 z-30 pointer-events-none">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-3 glass-dark rounded-2xl text-white shadow-xl border-white/10 pointer-events-auto"
          >
            <Menu className="w-6 h-6" />
          </button>

          <div className="flex items-center gap-4 pointer-events-auto">
            {/* Dynamic Breadcrumbs or Status could go here */}
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto custom-scrollbar">
          <div className="min-h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
