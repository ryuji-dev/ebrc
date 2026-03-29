'use client';

import { useState, useMemo, useEffect, memo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BIBLE_BOOKS, TOTAL_CHAPTERS, BibleBook } from '@/lib/constants/bible';
import { BookOpen, CheckCircle2, Flame, Target, ChevronDown, ChevronUp, Book, Trophy, RotateCcw, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BibleProgress {
    book_id: number;
    chapter: number;
    year: number;
    completed_at: string;
    deleted_at?: string | null;
}

interface BibleReadingTableProps {
    progress: BibleProgress[];
    cumulativeReadCount?: number;
}

export function BibleReadingTable({ progress, cumulativeReadCount: initialManualCount = 0 }: BibleReadingTableProps) {
    const router = useRouter();
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
    const [expandedBookId, setExpandedBookId] = useState<number | null>(null);
    const [loading, setLoading] = useState<Record<string, boolean>>({});
    const [optimisticProgress, setOptimisticProgress] = useState<BibleProgress[]>(progress);
    const [manualCount, setManualCount] = useState(initialManualCount);
    const [isIncrementing, setIsIncrementing] = useState(false);

    // Sync optimistic state with props when props change
    useEffect(() => {
        setOptimisticProgress(progress);
    }, [progress]);

    // Calculations
    const currentYearProgress = optimisticProgress.filter(p =>
        Number(p.year) === Number(selectedYear) && !p.deleted_at
    );
    const completedCount = currentYearProgress.length;
    const progressPercent = Math.round((completedCount / TOTAL_CHAPTERS) * 100);

    // Calculate total reads: count how many years have all chapters completed
    const totalReads = useMemo(() => {
        const yearGroups: Record<number, Set<string>> = {};
        optimisticProgress.forEach(p => {
            if (!p.deleted_at) {
                const y = Number(p.year);
                if (!yearGroups[y]) yearGroups[y] = new Set();
                yearGroups[y].add(`${p.book_id}-${p.chapter}`);
            }
        });
        const calculated = Object.values(yearGroups).filter(set => set.size === TOTAL_CHAPTERS).length;
        return calculated + manualCount;
    }, [optimisticProgress, manualCount]);

    const bookProgress = useMemo(() => {
        const progression: Record<number, number[]> = {};
        optimisticProgress.forEach(p => {
            if (Number(p.year) === Number(selectedYear) && !p.deleted_at) {
                const bookId = Number(p.book_id);
                if (!progression[bookId]) progression[bookId] = [];
                progression[bookId].push(Number(p.chapter));
            }
        });
        return progression;
    }, [optimisticProgress, selectedYear]);

    // 오늘 읽은 장 수 계산 (deleted_at 제외) - 로컬 타임존(KST) 기준 00시~24시
    const todayCount = useMemo(() => {
        const now = new Date();
        const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        return optimisticProgress.filter(p => {
            if (p.deleted_at) return false;
            const completedDate = new Date(p.completed_at);
            const localDateStr = `${completedDate.getFullYear()}-${String(completedDate.getMonth() + 1).padStart(2, '0')}-${String(completedDate.getDate()).padStart(2, '0')}`;
            return localDateStr === todayStr;
        }).length;
    }, [optimisticProgress]);

    const updateManualCount = async (increment: number) => {
        if (isIncrementing) return;
        if (increment < 0 && manualCount <= 0) return;

        setIsIncrementing(true);
        // Optimistic update
        setManualCount(prev => prev + increment);

        try {
            const resp = await fetch('/api/user/profile/increment-reads', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ increment }),
            });

            if (!resp.ok) {
                throw new Error('Failed to update');
            }
            router.refresh();
        } catch (err) {
            console.error(err);
            setManualCount(prev => prev - increment);
            alert('기록 저장 중 오류가 발생했습니다.');
        } finally {
            setIsIncrementing(false);
        }
    };

    const toggleChapter = async (bookId: number, chapter: number) => {
        const key = `${bookId}-${chapter}`;
        if (loading[key]) return;

        // Optimistic Update
        const isCurrentlyDone = bookProgress[bookId]?.includes(chapter); // Checks if it's done AND not deleted
        const prevProgress = [...optimisticProgress];

        setOptimisticProgress(prev => {
            const existingEntryIndex = prev.findIndex(p =>
                Number(p.book_id) === bookId &&
                Number(p.chapter) === chapter &&
                Number(p.year) === Number(selectedYear)
            );

            if (existingEntryIndex !== -1) {
                // If an entry exists, toggle its deleted_at status
                const updatedProgress = [...prev];
                const existingEntry = updatedProgress[existingEntryIndex];
                updatedProgress[existingEntryIndex] = {
                    ...existingEntry,
                    deleted_at: isCurrentlyDone ? new Date().toISOString() : null,
                    // Preserve original completed_at when restoring
                    completed_at: existingEntry.completed_at
                };
                return updatedProgress;
            } else {
                // If no entry exists, add a new one (marked as not deleted)
                return [...prev, {
                    book_id: bookId,
                    chapter: chapter,
                    year: Number(selectedYear),
                    completed_at: new Date().toISOString(),
                    deleted_at: null
                }];
            }
        });

        setLoading(prev => ({ ...prev, [key]: true }));
        try {
            const res = await fetch('/api/bible-reading/toggle', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bookId, chapter, year: Number(selectedYear) }),
            });
            if (!res.ok) {
                setOptimisticProgress(prevProgress); // Rollback
            } else {
                router.refresh();
            }
        } catch (err) {
            console.error(err);
            setOptimisticProgress(prevProgress); // Rollback
        } finally {
            setLoading(prev => ({ ...prev, [key]: false }));
        }
    };

    const toggleAllChapters = async (bookId: number) => {
        const key = `all-${bookId}`;
        if (loading[key]) return;

        const book = BIBLE_BOOKS.find(b => b.id === bookId);
        if (!book) return;

        const completedChapters = bookProgress[bookId] || [];
        const isCurrentlyAllDone = completedChapters.length === book.chapters;
        const prevProgress = [...optimisticProgress];

        if (isCurrentlyAllDone) {
            // Uncheck all (Soft Delete)
            setOptimisticProgress(prev => prev.map(p =>
                (Number(p.book_id) === bookId && Number(p.year) === Number(selectedYear))
                    ? { ...p, deleted_at: new Date().toISOString() }
                    : p
            ));
        } else {
            // Check all (Restore or Create)
            setOptimisticProgress(prev => {
                const restOfProgress = prev.filter(p =>
                    !(Number(p.book_id) === bookId && Number(p.year) === Number(selectedYear))
                );
                const bookEntries = Array.from({ length: book.chapters }, (_, i) => ({
                    book_id: bookId,
                    chapter: i + 1,
                    year: Number(selectedYear),
                    completed_at: new Date().toISOString(),
                    deleted_at: null
                }));
                // We actually want to keep old completed_at if possible,
                // but for optimistic UI simplicity, we'll just check if it was already there (even deleted)
                const restoredEntries = prev
                    .filter(p => Number(p.book_id) === bookId && Number(p.year) === Number(selectedYear))
                    .map(p => ({ ...p, deleted_at: null }));

                // If we have existing ones, use them (restores old dates), otherwise use new ones
                const finalEntries = bookEntries.map(be => {
                    const match = restoredEntries.find(re => Number(re.chapter) === be.chapter);
                    return match || be;
                });

                return [...restOfProgress, ...finalEntries];
            });
        }

        setLoading(prev => ({ ...prev, [key]: true }));
        try {
            const res = await fetch('/api/bible-reading/toggle', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    bookId,
                    all: true,
                    year: Number(selectedYear),
                    remove: isCurrentlyAllDone
                }),
            });
            if (!res.ok) {
                setOptimisticProgress(prevProgress); // Rollback
            } else {
                router.refresh();
            }
        } catch (err) {
            console.error(err);
            setOptimisticProgress(prevProgress); // Rollback
        } finally {
            setLoading(prev => ({ ...prev, [key]: false }));
        }
    };

const COLOR_CLASSES = {
    indigo: {
        bg: "bg-indigo-500/5",
        border: "border-indigo-500/20",
        hover: "hover:border-indigo-500/40",
        iconBg: "bg-indigo-500/20",
        iconText: "text-indigo-500",
        chapterDone: "bg-indigo-600",
        progress: "bg-indigo-500"
    },
    rose: {
        bg: "bg-rose-500/5",
        border: "border-rose-500/20",
        hover: "hover:border-rose-500/40",
        iconBg: "bg-rose-500/20",
        iconText: "text-rose-500",
        chapterDone: "bg-rose-500",
        progress: "bg-rose-500"
    }
} as const;

interface ChapterButtonProps {
    chapter: number;
    done: boolean;
    theme: 'indigo' | 'rose';
    onClick: () => void;
}

const ChapterButton = memo(({ chapter, done, theme, onClick }: ChapterButtonProps) => {
    const colors = COLOR_CLASSES[theme];
    return (
        <button
            onClick={onClick}
            className={cn(
                "aspect-square rounded-full flex items-center justify-center text-xs font-medium transition-all focus:outline-none focus:ring-2 focus:ring-primary/50",
                done
                    ? colors.chapterDone + " text-white"
                    : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700",
            )}
        >
            {chapter}
        </button>
    );
});

ChapterButton.displayName = 'ChapterButton';

interface BookItemProps {
    book: BibleBook;
    completedChapters: number[];
    isExpanded: boolean;
    isBulkLoading: boolean;
    theme: 'indigo' | 'rose';
    onToggleExpand: () => void;
    onToggleAll: () => void;
    onToggleChapter: (chapter: number) => void;
}

const BookItem = memo(({
    book,
    completedChapters,
    isExpanded,
    isBulkLoading,
    theme,
    onToggleExpand,
    onToggleAll,
    onToggleChapter
}: BookItemProps) => {
    const colors = COLOR_CLASSES[theme];
    const isCompleted = completedChapters.length === book.chapters;

    return (
        <div className="flex flex-col">
            <div className={cn(
                "w-full p-4 rounded-2xl border transition-all duration-300 flex items-center justify-between",
                isCompleted
                    ? `${colors.bg} ${colors.border} ${colors.hover}`
                    : "bg-white/5 border-white/10 hover:border-white/20",
                isExpanded && (theme === 'indigo' ? "ring-2 ring-indigo-500/50" : "ring-2 ring-rose-500/50")
            )}>
                <button
                    onClick={onToggleExpand}
                    className="flex items-center gap-3 flex-1 text-left"
                >
                    <div className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center",
                        isCompleted
                            ? colors.iconBg + " " + colors.iconText
                            : `${colors.iconBg.replace('20', '10')} ${colors.iconText}`
                    )}>
                        <Book className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                        <h3 className="text-white">{book.name}</h3>
                        <p className="text-xs text-zinc-500">
                            {completedChapters.length} / {book.chapters} 장 읽음
                        </p>
                    </div>
                </button>
                <div className="flex items-center gap-1">
                    <button
                        disabled={isBulkLoading}
                        onClick={onToggleAll}
                        className={cn(
                            "p-2 rounded-lg transition-colors hover:bg-white/5",
                            isBulkLoading ? "animate-pulse" : `text-zinc-500 ${theme === 'indigo' ? 'hover:text-indigo-400' : 'hover:text-rose-400'}`,
                            isCompleted && (theme === 'indigo' ? "text-indigo-500 hover:text-indigo-500" : "text-rose-500 hover:text-rose-500")
                        )}
                        title={isCompleted ? "전체 해제" : "전체 선택"}
                    >
                        {isCompleted ? <RotateCcw className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                    </button>
                    <button
                        onClick={onToggleExpand}
                        className="p-2 text-zinc-500"
                    >
                        {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                </div>
            </div>

            {isExpanded && (
                <div className="mt-2 p-4 bg-zinc-900/50 border border-white/5 rounded-2xl animate-in fade-in slide-in-from-top-2 grid grid-cols-10 gap-2">
                    {Array.from({ length: book.chapters }, (_, i) => i + 1).map(chapter => (
                        <ChapterButton
                            key={chapter}
                            chapter={chapter}
                            done={completedChapters.includes(chapter)}
                            theme={theme}
                            onClick={() => onToggleChapter(chapter)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
});

BookItem.displayName = 'BookItem';

    return (
        <div className="space-y-8">
            {/* Year Selector & Global Stats */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex bg-zinc-900/50 p-1 rounded-2xl border border-white/5">
                    {[2026, 2027, 2028].map(y => (
                        <button
                            key={y}
                            onClick={() => setSelectedYear(y.toString())}
                            className={cn(
                                "px-6 py-2 rounded-xl text-sm transition-all",
                                selectedYear === y.toString()
                                    ? "bg-primary text-white shadow-lg"
                                    : "text-zinc-500 hover:text-white"
                            )}
                        >
                            {y}년
                        </button>
                    ))}
                </div>
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="glass-dark border-white/5 shadow-none overflow-hidden group hover:border-primary/30 transition-all duration-500 rounded-[2rem]">
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-sm text-zinc-300 uppercase tracking-tight mb-2">
                            <Target className="w-4 h-4 text-primary" />
                            {selectedYear}년 진행률
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-end justify-between">
                            <div className="text-3xl text-white tracking-tight">{progressPercent}%</div>
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center transition-all duration-500 group-hover:bg-primary group-hover:text-white group-hover:shadow-[0_0_20px_rgba(var(--primary),0.4)]">
                                <Target className="w-6 h-6" />
                            </div>
                        </div>
                        <div className="mt-4 w-full h-2 bg-white/5 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-primary transition-all duration-1000"
                                style={{ width: `${progressPercent}%` }}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass-dark border-white/5 shadow-none overflow-hidden group hover:border-orange-500/30 transition-all duration-500 rounded-[2rem]">
                    <CardHeader className="pb-2">
                        <CardTitle className="flex items-center gap-2 text-sm text-zinc-300 uppercase tracking-tight mb-2">
                            <Flame className="w-4 h-4 text-orange-500" />
                            오늘 읽은 장 수
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-end justify-between">
                            <div className="text-3xl text-white tracking-tight">{todayCount}장</div>
                            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center transition-all duration-500 group-hover:bg-orange-500 group-hover:text-white group-hover:shadow-[0_0_20px_rgba(249,115,22,0.4)]">
                                <Flame className="w-6 h-6" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="glass-dark border-white/5 shadow-none overflow-hidden group hover:border-yellow-500/30 transition-all duration-500 rounded-[2rem]">
                    <CardHeader className="pb-2">
                        <div className="text-zinc-500 text-sm tracking-tight mb-2 uppercase flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Trophy className="w-4 h-4 text-yellow-500" />
                                누적 완독
                            </div>
                            <div className="flex items-center gap-1.5">
                                {manualCount > 0 && (
                                    <button
                                        onClick={() => updateManualCount(-1)}
                                        disabled={isIncrementing}
                                        className="w-6 h-6 flex items-center justify-center bg-yellow-500/5 border border-yellow-500/10 rounded-md hover:bg-yellow-500/20 hover:border-yellow-500/30 transition-all text-yellow-500/60 hover:text-yellow-500 active:scale-95 disabled:opacity-50"
                                        title="1독 감소"
                                    >
                                        <Minus className="w-3 h-3" />
                                    </button>
                                )}
                                <button
                                    onClick={() => updateManualCount(1)}
                                    disabled={isIncrementing}
                                    className="text-[10px] bg-yellow-500/5 border border-yellow-500/10 px-2 py-0.5 h-6 flex items-center rounded-md hover:bg-yellow-500/20 hover:border-yellow-500/30 transition-all text-yellow-500/60 hover:text-yellow-500 active:scale-95 disabled:opacity-50"
                                >
                                    {isIncrementing ? "..." : "+ 1독 추가 (과거 기록)"}
                                </button>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-end justify-between">
                            <div className="text-3xl text-white tracking-tight">{totalReads}회</div>
                            <div className="w-12 h-12 rounded-2xl bg-yellow-500/10 text-yellow-500 flex items-center justify-center transition-all duration-500 group-hover:bg-yellow-500 group-hover:text-white group-hover:shadow-[0_0_20px_rgba(234,179,8,0.4)]">
                                <Trophy className="w-6 h-6" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Bible Sections */}
            <div className="space-y-12">
                <section>
                    <h2 className="text-xl text-white mb-6 flex items-center gap-2">
                        <div className="w-2 h-6 bg-indigo-500 rounded-full" />
                        구약 성경 (Old Testament)
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {BIBLE_BOOKS.filter(b => b.category === 'Old').map(book => (
                            <BookItem
                                key={book.id}
                                book={book}
                                theme="indigo"
                                completedChapters={bookProgress[book.id] || []}
                                isExpanded={expandedBookId === book.id}
                                isBulkLoading={!!loading[`all-${book.id}`]}
                                onToggleExpand={() => setExpandedBookId(expandedBookId === book.id ? null : book.id)}
                                onToggleAll={() => toggleAllChapters(book.id)}
                                onToggleChapter={(chapter) => toggleChapter(book.id, chapter)}
                            />
                        ))}
                    </div>
                </section>

                <section>
                    <h2 className="text-xl text-white mb-6 flex items-center gap-2">
                        <div className="w-2 h-6 bg-rose-500 rounded-full" />
                        신약 성경 (New Testament)
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {BIBLE_BOOKS.filter(b => b.category === 'New').map(book => (
                            <BookItem
                                key={book.id}
                                book={book}
                                theme="rose"
                                completedChapters={bookProgress[book.id] || []}
                                isExpanded={expandedBookId === book.id}
                                isBulkLoading={!!loading[`all-${book.id}`]}
                                onToggleExpand={() => setExpandedBookId(expandedBookId === book.id ? null : book.id)}
                                onToggleAll={() => toggleAllChapters(book.id)}
                                onToggleChapter={(chapter) => toggleChapter(book.id, chapter)}
                            />
                        ))}
                    </div>
                </section>
            </div>
        </div>
    );
}
