'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { BIBLE_BOOKS } from '@/lib/constants/bible';
import { formatTimestampKST } from '@/lib/utils/date';
import { Users, CheckCircle2, BookOpen, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Plan {
    id: string;
    title: string;
    description: string | null;
    book_ids: number[];
    total_chapters: number;
    is_active: boolean;
    created_at: string;
    participant_count: number;
    my_participation: { joined_at: string; completed_at: string | null } | null;
}

interface PlanListProps {
    plans: Plan[];
}

export function PlanList({ plans }: PlanListProps) {
    const router = useRouter();
    const [joiningId, setJoiningId] = useState<string | null>(null);

    const handleJoin = async (planId: string) => {
        if (joiningId) return;
        setJoiningId(planId);
        try {
            const res = await fetch(`/api/plans/${planId}/join`, {
                method: 'POST',
            });
            if (res.ok) {
                router.push(`/plans/${planId}`);
            } else {
                const err = await res.json();
                alert(err.error || '참여 중 오류가 발생했습니다.');
            }
        } catch {
            alert('참여 중 오류가 발생했습니다.');
        } finally {
            setJoiningId(null);
        }
    };

    if (plans.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
                <BookOpen className="w-12 h-12 text-zinc-700" />
                <p className="text-zinc-500">아직 등록된 통독 플랜이 없습니다.</p>
                <p className="text-zinc-600 text-sm">관리자가 플랜을 생성하면 여기에 표시됩니다.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {plans.map(plan => {
                const bookNames = BIBLE_BOOKS
                    .filter(b => plan.book_ids.includes(b.id))
                    .map(b => b.name);
                const displayBooks = bookNames.slice(0, 4).join(', ') + (bookNames.length > 4 ? ` 외 ${bookNames.length - 4}권` : '');
                const isJoined = !!plan.my_participation;
                const isCompleted = !!plan.my_participation?.completed_at;

                return (
                    <div
                        key={plan.id}
                        className={cn(
                            "glass-dark border rounded-[2rem] p-6 space-y-5 transition-all duration-300",
                            isCompleted
                                ? "border-yellow-500/30 hover:border-yellow-500/50"
                                : isJoined
                                    ? "border-primary/30 hover:border-primary/50"
                                    : "border-white/5 hover:border-white/15"
                        )}
                    >
                        <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1 flex-1 min-w-0">
                                <h3 className="text-white text-lg tracking-tight">{plan.title}</h3>
                                {plan.description && (
                                    <p className="text-zinc-500 text-sm">{plan.description}</p>
                                )}
                            </div>
                            {isCompleted && (
                                <span className="px-2 py-0.5 rounded-full text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/20 shrink-0">
                                    완독
                                </span>
                            )}
                            {isJoined && !isCompleted && (
                                <span className="px-2 py-0.5 rounded-full text-xs bg-primary/20 text-primary border border-primary/20 shrink-0">
                                    참여 중
                                </span>
                            )}
                        </div>

                        <div className="space-y-2 text-sm">
                            <div className="flex items-center gap-2 text-zinc-500">
                                <BookOpen className="w-4 h-4 shrink-0" />
                                <span className="truncate">{displayBooks}</span>
                            </div>
                            <div className="flex items-center gap-4 text-zinc-500">
                                <span>{plan.total_chapters}장</span>
                                <span className="flex items-center gap-1">
                                    <Users className="w-3.5 h-3.5" />
                                    {plan.participant_count}명 참여 중
                                </span>
                            </div>
                        </div>

                        {isCompleted && plan.my_participation?.completed_at && (
                            <div className="p-3 rounded-2xl bg-yellow-500/10 border border-yellow-500/20">
                                <p className="text-xs text-zinc-500 mb-0.5">완독 시간</p>
                                <p className="text-yellow-400 font-mono text-sm">
                                    {formatTimestampKST(plan.my_participation.completed_at)}
                                </p>
                            </div>
                        )}

                        <div className="pt-1">
                            {isJoined ? (
                                <Link
                                    href={`/plans/${plan.id}`}
                                    className="flex items-center justify-center gap-2 w-full py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-white text-sm transition-all"
                                >
                                    진행 현황 보기
                                    <ArrowRight className="w-4 h-4" />
                                </Link>
                            ) : (
                                <button
                                    onClick={() => handleJoin(plan.id)}
                                    disabled={joiningId === plan.id || !plan.is_active}
                                    className={cn(
                                        "flex items-center justify-center gap-2 w-full py-3 rounded-2xl text-sm transition-all",
                                        plan.is_active
                                            ? "bg-primary hover:bg-primary/90 text-white hover:shadow-[0_0_20px_hsl(var(--primary)/0.4)]"
                                            : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                                    )}
                                >
                                    {joiningId === plan.id ? (
                                        "참여 중..."
                                    ) : plan.is_active ? (
                                        <>
                                            <CheckCircle2 className="w-4 h-4" />
                                            플랜 참여하기
                                        </>
                                    ) : (
                                        "종료된 플랜"
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
