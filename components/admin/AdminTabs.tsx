'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Users, UserCog } from 'lucide-react';

export function AdminTabs() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get('tab') || 'accounts';

  const tabs = [
    {
      id: 'accounts',
      label: '계정 관리',
      icon: UserCog,
    },
    {
      id: 'members',
      label: '가입 교우',
      icon: Users,
    },
  ];

  const handleTabChange = (tabId: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tabId);
    if (tabId === 'members') {
        params.delete('page');
    }
    router.push(`/admin?${params.toString()}`);
  };

  return (
    <div className="flex items-center gap-8 border-b border-white/10 mb-8">
      {tabs.map((tab) => {
        const isActive = currentTab === tab.id;
        const Icon = tab.icon;
        
        return (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={cn(
              "relative flex items-center gap-2 pb-4 -mb-[1px] transition-all duration-300",
              isActive 
                ? "text-primary border-b-2 border-primary" 
                : "text-zinc-500 hover:text-zinc-300 border-b-2 border-transparent"
            )}
          >
            <Icon className={cn("w-5 h-5", isActive ? "text-primary" : "text-zinc-500")} />
            <span className={cn(
              "font-medium text-lg",
              isActive ? "text-primary" : "text-zinc-500"
            )}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
