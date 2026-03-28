'use client';

import Link from 'next/link';
import { Database } from '@/types/database.types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, History, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DeleteUserButton } from './DeleteUserButton';
import { useSearchParams } from 'next/navigation';

type UserProfile = Database['public']['Tables']['user_profiles']['Row'];

interface MemberListProps {
  memberList: UserProfile[] | null;
  todayCheckinData: { user_id: string }[];
  currentUserId: string;
  currentPage: number;
  totalPages: number;
}

export function MemberList({
  memberList,
  todayCheckinData,
  currentUserId,
  currentPage,
  totalPages,
}: MemberListProps) {
  // 현재 탭 정보를 유지하기 위해 query param을 가져옴 (기본: members)
  // 하지만 이 컴포넌트는 이미 members 탭일 때만 렌더링되므로, 링크 생성 시 tab=members를 명시하면 됨.
  
  return (
    <Card className="glass-dark border-white/5 rounded-[2.5rem] overflow-hidden flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-700">
      <CardHeader className="p-8 pb-4">
        <CardTitle className="text-2xl text-white flex items-center gap-3 font-normal">
          <Users className="w-6 h-6 text-primary" />
          가입 교우 목록
        </CardTitle>
        <CardDescription className="text-zinc-500 font-normal">
          전체 교우 명단입니다. (페이지당 10명)
        </CardDescription>
      </CardHeader>
      <CardContent className="px-4 pt-0 md:px-8 md:pt-0 flex flex-col">
        <div className="overflow-x-auto">
          {/* Mobile View (List) */}
          <div className="md:hidden space-y-px">
            {memberList?.map((u, index) => {
              const isCheckedIn = todayCheckinData.some(c => c.user_id === u.id);
              const isLast = index === (memberList?.length || 0) - 1;
              return (
                <div 
                  key={u.id} 
                  className={cn(
                    "flex items-center gap-3 p-4 bg-transparent",
                    !isLast && "border-b border-white/5"
                  )}
                >
                  {/* Status */}
                  <div className="shrink-0">
                    {isCheckedIn ? (
                      <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-500/10 text-green-500">
                        <History className="w-4 h-4" />
                      </div>
                    ) : (
                      <div className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-zinc-800/50 text-zinc-600">
                        <div className="w-1.5 h-1.5 rounded-full bg-current" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0 flex flex-col justify-center gap-0.5">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium truncate">{u.full_name}</span>
                      <span className={cn(
                        "px-1.5 py-0.5 rounded text-[10px] font-medium tracking-wide uppercase",
                        u.role === 'admin' ? "bg-primary/20 text-primary" :
                        u.role === 'leader' ? "bg-primary/20 text-primary" : "bg-zinc-800 text-zinc-500"
                      )}>
                        {u.role === 'admin' ? '목사님' : u.role === 'leader' ? '리더' : '교우'}
                      </span>
                    </div>
                    <div className="text-xs text-zinc-500 truncate font-normal">{u.email}</div>
                  </div>

                  {/* Action */}
                  <div className="shrink-0">
                    {currentUserId !== u.id && (
                      <DeleteUserButton userId={u.id} userName={u.full_name || ''} />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Desktop View (Table) */}
          <table className="hidden md:table w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5">
                <th className="py-4 text-xs font-medium text-zinc-500 uppercase tracking-widest text-center w-16">참여</th>
                <th className="py-4 text-xs font-medium text-zinc-500 uppercase tracking-widest">이름</th>
                <th className="py-4 text-xs font-medium text-zinc-500 uppercase tracking-widest">이메일</th>
                <th className="py-4 text-xs font-medium text-zinc-500 uppercase tracking-widest text-center">권한</th>
                <th className="py-4 text-xs font-medium text-zinc-500 uppercase tracking-widest text-center">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-normal">
              {memberList?.map((u) => {
                const isCheckedIn = todayCheckinData.some(c => c.user_id === u.id);
                return (
                  <tr key={u.id} className="group hover:bg-white/[0.02] transition-colors">
                    <td className="py-5 text-center">
                      {isCheckedIn ? (
                        <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-green-500/20 text-green-500">
                          <History className="w-3.5 h-3.5" />
                        </div>
                      ) : (
                        <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-zinc-800/50 text-zinc-600">
                          <div className="w-1.5 h-1.5 rounded-full bg-current" />
                        </div>
                      )}
                    </td>
                    <td className="py-5 text-white font-normal">{u.full_name}</td>
                    <td className="py-5 text-zinc-400 font-normal">{u.email}</td>
                    <td className="py-5 text-center">
                      <span className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-normal tracking-widest uppercase border border-transparent",
                        u.role === 'admin' ? "bg-primary/20 text-primary border-primary/10" :
                          u.role === 'leader' ? "bg-primary/20 text-primary border-primary/10" : "bg-zinc-800 text-zinc-500"
                      )}>
                        {u.role === 'admin' ? '목사님' : u.role === 'leader' ? '리더' : '교우'}
                      </span>
                    </td>
                    <td className="py-5 text-center">
                      {currentUserId !== u.id && (
                        <DeleteUserButton userId={u.id} userName={u.full_name || ''} />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-4 pt-4 pb-6 px-6 border-t border-white/5 font-normal">
            <Link
              href={`/admin?tab=members&page=${Math.max(1, currentPage - 1)}`}
              className={cn(
                "p-2 rounded-xl border border-white/5 bg-white/5 text-zinc-400 hover:text-white transition-all",
                currentPage === 1 && "opacity-30 pointer-events-none"
              )}
            >
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <div className="text-zinc-500 text-sm">
              <span className="text-white">{currentPage}</span> / {totalPages}
            </div>
            <Link
              href={`/admin?tab=members&page=${Math.min(totalPages, currentPage + 1)}`}
              className={cn(
                "p-2 rounded-xl border border-white/5 bg-white/5 text-zinc-400 hover:text-white transition-all",
                currentPage === totalPages && "opacity-30 pointer-events-none"
              )}
            >
              <ChevronRight className="w-5 h-5" />
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
