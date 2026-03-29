'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BIBLE_BOOKS } from '@/lib/constants/bible';
import { formatTimestampKST } from '@/lib/utils/date';
import { BookOpen, CheckCircle2, RotateCcw, ChevronDown, ChevronUp, Book, Timer, ArrowLeft, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface Plan {
    id: string;
    title: string;
    description: string | null;
    book_ids: number[];
    total_chapters: number;
}

interface Participation {
    joined_at: string;
    completed_at: string | null;
}

interface ChapterProgress {
    book_id: number;
    chapter: number;
    completed_at: string;
}

interface PlanDetailProps {
    plan: Plan;
    myParticipation: Participation | null;
    myProgress: ChapterProgress[];
}

export function PlanDetail({ plan, myParticipation: initialParticipation, myProgress: initialProgress }: PlanDetailProps) {
    const router = useRouter();
    const [participation, setParticipation] = useState(initialParticipation);
    const [progress, setProgress] = useState<ChapterProgress[]>(initialProgress);
    const [loading, setLoading] = useState<Record<string, boolean>>({});
    const [expandedBookId, setExpandedBookId] = useState<number | null>(null);
    const [isJoining, setIsJoining] = useState(false);

    useEffect(() => {
        setProgress(initialProgress);
    }, [initialProgress]);

    const planBooks = useMemo(
        () => BIBLE_BOOKS.filter(b => plan.book_ids.includes(b.id)),
        [plan.book_ids]
    );

    const bookProgress = useMemo(() => {
        const map: Record<number, number[]> = {};
        progress.forEach(p => {
            if (!map[p.book_id]) map[p.book_id] = [];
            map[p.book_id].push(p.chapter);
        });
        return map;
    }, [progress]);

    const completedChapters = progress.length;
    const progressPct = Math.round((completedChapters / plan.total_chapters) * 100);

    const handleJoin = async () => {
        if (isJoining) return;
        setIsJoining(true);
        try {
            const res = await fetch(`/api/plans/${plan.id}/join`, { method: 'POST' });
            if (res.ok) {
                const data = await res.json();
                setParticipation(data.participant);
                router.refresh();
            } else {
                const err = await res.json();
                alert(err.error || '참여 중 오류가 발생했습니다.');
            }
        } catch {
            alert('참여 중 오류가 발생했습니다.');
        } finally {
            setIsJoining(false);
        }
    };

    const toggleChapter = async (bookId: number, chapter: number) => {
        const key = `${bookId}-${chapter}`;
        if (loading[key]) return;

        const isDone = bookProgress[bookId]?.includes(chapter);
        const prev = [...progress];

        // Optimistic update
        if (isDone) {
            setProgress(p => p.filter(r => !(r.book_id === bookId && r.chapter === chapter)));
        } else {
            setProgress(p => [...p, { book_id: bookId, chapter, completed_at: new Date().toISOString() }]);
        }

        setLoading(l => ({ ...l, [key]: true }));
        try {
            const res = await fetch(`/api/plans/${plan.id}/progress`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bookId, chapter }),
            });
            if (!res.ok) {
                setProgress(prev);
            } else {
                router.refresh();
            }
        } catch {
            setProgress(prev);
        } finally {
            setLoading(l => ({ ...l, [key]: false }));
        }
    };

    const toggleAllChapters = async (bookId: number) => {
        const key = `all-${bookId}`;
        if (loading[key]) return;

        const book = BIBLE_BOOKS.find(b => b.id === bookId);
        if (!book) return;

        const completed = bookProgress[bookId] || [];
        const isAllDone = completed.length === book.chapters;
        const prev = [...progress];

        // Optimistic update
        if (isAllDone) {
            setProgress(p => p.filter(r => r.book_id !== bookId));
        } else {
            const existing = new Set(completed);
            const additions: ChapterProgress[] = [];
            for (let i = 1; i <= book.chapters; i++) {
                if (!existing.has(i)) {
                    additions.push({ book_id: bookId, chapter: i, completed_at: new Date().toISOString() });
                }
            }
            setProgress(p => [...p.filter(r => r.book_id !== bookId), ...p.filter(r => r.book_id === bookId), ...additions]);
        }

        setLoading(l => ({ ...l, [key]: true }));
        try {
            const res = await fetch(`/api/plans/${plan.id}/progress`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bookId, all: true, remove: isAllDone }),
            });
            if (!res.ok) {
                setProgress(prev);
            } else {
                router.refresh();
            }
        } catch {
            setProgress(prev);
        } finally {
            setLoading(l => ({ ...l, [key]: false }));
        }
    };

    // 미참여 상태
    if (!participation) {
        return (
            <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-1000">
                <Link href="/plans" className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors text-sm">
                    <ArrowLeft className="w-4 h-4" />
                    통독 플랜 목록
                </Link>

                <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-primary/20 via-primary/5 to-transparent border border-white/5 p-6 md:p-10">
                    <div className="relative z-10 space-y-3">
                        <h1 className="text-2xl md:text-4xl text-white tracking-tight">{plan.title}</h1>
                        {plan.description && <p className="text-zinc-400">{plan.description}</p>}
                        <p className="text-zinc-500 text-sm">총 {plan.total_chapters}장 · {planBooks.length}권</p>
                    </div>
                    <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[120%] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />
                </div>

                <div className="flex flex-col items-center justify-center py-10 space-y-4">
                    <p className="text-zinc-400">이 플랜에 참여하면 챕터를 체크하고 완독 시간을 기록할 수 있습니다.</p>
                    <button
                        onClick={handleJoin}
                        disabled={isJoining}
                        className="px-8 py-3 bg-primary hover:bg-primary/90 text-white rounded-2xl transition-all hover:shadow-[0_0_20px_hsl(var(--primary)/0.4)] disabled:opacity-50"
                    >
                        {isJoining ? "참여 중..." : "이 플랜 참여하기"}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-1000">
            <Link href="/plans" className="flex items-center gap-2 text-zinc-500 hover:text-white transition-colors text-sm">
                <ArrowLeft className="w-4 h-4" />
                통독 플랜 목록
            </Link>

            {/* 헤더 */}
            <div className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-primary/20 via-primary/5 to-transparent border border-white/5 p-6 md:p-10">
                <div className="relative z-10 space-y-3">
                    <h1 className="text-2xl md:text-4xl text-white tracking-tight">{plan.title}</h1>
                    {plan.description && <p className="text-zinc-400">{plan.description}</p>}
                    <p className="text-zinc-500 text-sm">총 {plan.total_chapters}장 · {planBooks.length}권</p>
                </div>
                <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[120%] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />
            </div>

            {/* 진행률 + 완독 기록 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="glass-dark border border-white/5 rounded-[2rem] p-6 space-y-3">
                    <div className="flex items-center gap-2 text-sm text-zinc-400 uppercase tracking-wide">
                        <Target className="w-4 h-4 text-primary" />
                        진행률
                    </div>
                    <div className="text-3xl text-white tracking-tight">{progressPct}%</div>
                    <div className="text-zinc-600 text-xs font-mono">{completedChapters} / {plan.total_chapters}장</div>
                    <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-primary transition-all duration-1000"
                            style={{ width: `${progressPct}%` }}
                        />
                    </div>
                </div>

                <div className={cn(
                    "glass-dark border rounded-[2rem] p-6 space-y-3 transition-all",
                    participation.completed_at ? "border-yellow-500/30" : "border-white/5"
                )}>
                    <div className="flex items-center gap-2 text-sm text-zinc-400 uppercase tracking-wide">
                        <Timer className="w-4 h-4 text-yellow-500" />
                        완독 시간
                    </div>
                    {participation.completed_at ? (
                        <>
                            <div className="text-yellow-400 font-mono text-lg">
                                {formatTimestampKST(participation.completed_at)}
                            </div>
                            <div className="text-xs text-zinc-600">완독을 축하합니다!</div>
                        </>
                    ) : (
                        <div className="text-zinc-600 text-sm pt-2">모든 장을 완독하면 기록됩니다.</div>
                    )}
                </div>
            </div>

            {/* 책별 챕터 그리드 */}
            <div className="space-y-8">
                {/* 구약 */}
                {planBooks.some(b => b.category === 'Old') && (
                    <div className="space-y-4">
                        <h2 className="text-lg text-white tracking-tight flex items-center gap-2">
                            <div className="w-2 h-6 bg-indigo-500 rounded-full" />
                            구약 성경
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {planBooks.filter(b => b.category === 'Old').map(book => renderBook(book))}
                        </div>
                    </div>
                )}
                {/* 신약 */}
                {planBooks.some(b => b.category === 'New') && (
                    <div className="space-y-4">
                        <h2 className="text-lg text-white tracking-tight flex items-center gap-2">
                            <div className="w-2 h-6 bg-rose-500 rounded-full" />
                            신약 성경
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {planBooks.filter(b => b.category === 'New').map(book => renderBook(book))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );

    function renderBook(book: (typeof planBooks)[number]) {
                        const completed = bookProgress[book.id] || [];
                        const isAllDone = completed.length === book.chapters;
                        const isExpanded = expandedBookId === book.id;
                        const isBulkLoading = loading[`all-${book.id}`];
                        const isNT = book.category === 'New';

                        const colors = isNT
                            ? { bg: 'bg-rose-500/5', border: 'border-rose-500/20', hover: 'hover:border-rose-500/40', iconBg: 'bg-rose-500/20', iconText: 'text-rose-500', ring: 'ring-rose-500/30', chapterDone: 'bg-rose-500', btnHover: 'hover:text-rose-400', btnActive: 'text-rose-500' }
                            : { bg: 'bg-indigo-500/5', border: 'border-indigo-500/20', hover: 'hover:border-indigo-500/40', iconBg: 'bg-indigo-500/20', iconText: 'text-indigo-500', ring: 'ring-indigo-500/30', chapterDone: 'bg-indigo-600', btnHover: 'hover:text-indigo-400', btnActive: 'text-indigo-500' };

                        return (
                            <div key={book.id} className="flex flex-col">
                                <div className={cn(
                                    "w-full p-4 rounded-2xl border transition-all duration-300 flex items-center justify-between",
                                    isAllDone
                                        ? `${colors.bg} ${colors.border} ${colors.hover}`
                                        : "bg-white/5 border-white/10 hover:border-white/20",
                                    isExpanded && `ring-2 ${colors.ring}`
                                )}>
                                    <button
                                        onClick={() => setExpandedBookId(isExpanded ? null : book.id)}
                                        className="flex items-center gap-3 flex-1 text-left"
                                    >
                                        <div className={cn(
                                            "w-10 h-10 rounded-xl flex items-center justify-center",
                                            isAllDone ? `${colors.iconBg} ${colors.iconText}` : "bg-white/5 text-zinc-500"
                                        )}>
                                            <Book className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-white">{book.name}</p>
                                            <p className="text-xs text-zinc-500">{completed.length} / {book.chapters}장</p>
                                        </div>
                                    </button>
                                    <div className="flex items-center gap-1">
                                        <button
                                            disabled={isBulkLoading}
                                            onClick={() => toggleAllChapters(book.id)}
                                            className={cn(
                                                "p-2 rounded-lg transition-colors hover:bg-white/5",
                                                isBulkLoading ? "animate-pulse" : `text-zinc-500 ${colors.btnHover}`,
                                                isAllDone && colors.btnActive
                                            )}
                                            title={isAllDone ? "전체 해제" : "전체 선택"}
                                        >
                                            {isAllDone ? <RotateCcw className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                                        </button>
                                        <button
                                            onClick={() => setExpandedBookId(isExpanded ? null : book.id)}
                                            className="p-2 text-zinc-500"
                                        >
                                            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                                        </button>
                                    </div>
                                </div>

                                {isExpanded && (
                                    <div className="mt-2 p-4 bg-zinc-900/50 border border-white/5 rounded-2xl animate-in fade-in slide-in-from-top-2 grid grid-cols-10 gap-2">
                                        {Array.from({ length: book.chapters }, (_, i) => i + 1).map(ch => {
                                            const done = completed.includes(ch);
                                            return (
                                                <button
                                                    key={ch}
                                                    onClick={() => toggleChapter(book.id, ch)}
                                                    className={cn(
                                                        "aspect-square rounded-full flex items-center justify-center text-xs font-medium transition-all",
                                                        done
                                                            ? `${colors.chapterDone} text-white`
                                                            : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                                                    )}
                                                >
                                                    {ch}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
    }
}
