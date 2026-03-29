'use client';

import { useState, useEffect, useCallback } from 'react';
import { BIBLE_BOOKS } from '@/lib/constants/bible';
import { formatTimestampKST } from '@/lib/utils/date';
import { Plus, BookOpen, Users, Trophy, ChevronDown, ChevronUp, RefreshCw, X, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

const OT_BOOKS = BIBLE_BOOKS.filter(b => b.category === 'Old');
const NT_BOOKS = BIBLE_BOOKS.filter(b => b.category === 'New');

interface Plan {
    id: string;
    title: string;
    description: string | null;
    book_ids: number[];
    total_chapters: number;
    is_active: boolean;
    created_at: string;
    participant_count: number;
    completed_count: number;
}

export function PlanManager() {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);

    const fetchPlans = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/plans');
            if (res.ok) {
                const data = await res.json();
                setPlans(data.plans || []);
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchPlans(); }, [fetchPlans]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-white text-lg tracking-tight">통독 플랜 관리</h2>
                    <p className="text-zinc-500 text-xs mt-0.5">플랜을 만들면 사용자들이 참여할 수 있습니다.</p>
                </div>
                <button
                    onClick={() => setShowForm(v => !v)}
                    className={cn(
                        "flex items-center gap-2 px-4 py-2 rounded-2xl text-sm transition-all",
                        showForm
                            ? "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                            : "bg-primary text-white hover:bg-primary/90 hover:shadow-[0_0_20px_hsl(var(--primary)/0.4)]"
                    )}
                >
                    {showForm ? <><X className="w-4 h-4" /> 취소</> : <><Plus className="w-4 h-4" /> 새 플랜 만들기</>}
                </button>
            </div>

            {showForm && (
                <CreatePlanForm onCreated={() => { setShowForm(false); fetchPlans(); }} />
            )}

            {loading ? (
                <div className="py-10 flex items-center justify-center text-zinc-500">
                    <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                    불러오는 중...
                </div>
            ) : plans.length === 0 ? (
                <div className="py-10 text-center text-zinc-500 text-sm">
                    아직 만든 플랜이 없습니다.
                </div>
            ) : (
                <div className="space-y-3">
                    {plans.map(plan => (
                        <PlanRow key={plan.id} plan={plan} onRefresh={fetchPlans} />
                    ))}
                </div>
            )}
        </div>
    );
}

function CreatePlanForm({ onCreated }: { onCreated: () => void }) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [selectedBookIds, setSelectedBookIds] = useState<number[]>([]);
    const [saving, setSaving] = useState(false);

    const selectedBooks = BIBLE_BOOKS.filter(b => selectedBookIds.includes(b.id));
    const totalChapters = selectedBooks.reduce((acc, b) => acc + b.chapters, 0);

    const applyPreset = (type: 'ot' | 'nt' | 'full') => {
        if (type === 'ot') setSelectedBookIds(OT_BOOKS.map(b => b.id));
        else if (type === 'nt') setSelectedBookIds(NT_BOOKS.map(b => b.id));
        else setSelectedBookIds(BIBLE_BOOKS.map(b => b.id));
    };

    const toggleBook = (bookId: number) => {
        setSelectedBookIds(prev =>
            prev.includes(bookId) ? prev.filter(id => id !== bookId) : [...prev, bookId]
        );
    };

    const handleSubmit = async () => {
        if (!title.trim() || selectedBookIds.length === 0) {
            toast.error('제목과 대상 책을 선택해주세요.');
            return;
        }
        setSaving(true);
        try {
            const res = await fetch('/api/admin/plans', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: title.trim(), description: description.trim() || null, book_ids: selectedBookIds }),
            });
            if (res.ok) {
                toast.success('플랜이 생성되었습니다.');
                onCreated();
            } else {
                const err = await res.json();
                toast.error(err.error || '플랜 생성 중 오류가 발생했습니다.');
            }
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="glass-dark border border-primary/20 rounded-[2rem] p-6 space-y-6 animate-in fade-in duration-300">
            <h3 className="text-white text-sm uppercase tracking-wide">새 통독 플랜</h3>

            {/* 제목 */}
            <div className="space-y-2">
                <label className="text-xs text-zinc-500 uppercase tracking-wide">제목 *</label>
                <input
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="예: 2026 창세기 통독"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-primary/50 transition-colors"
                />
            </div>

            {/* 설명 */}
            <div className="space-y-2">
                <label className="text-xs text-zinc-500 uppercase tracking-wide">설명 (선택)</label>
                <textarea
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="플랜에 대한 간단한 설명을 입력하세요."
                    rows={2}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-white placeholder:text-zinc-600 focus:outline-none focus:border-primary/50 transition-colors resize-none"
                />
            </div>

            {/* 책 선택 */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <label className="text-xs text-zinc-500 uppercase tracking-wide">대상 책 *</label>
                    {selectedBookIds.length > 0 && (
                        <span className="text-xs text-primary">{selectedBooks.length}권 / {totalChapters}장 선택됨</span>
                    )}
                </div>

                {/* 프리셋 */}
                <div className="flex flex-wrap gap-2">
                    {[
                        { label: '구약 전체', type: 'ot' as const, count: '929장' },
                        { label: '신약 전체', type: 'nt' as const, count: '260장' },
                        { label: '전체 성경', type: 'full' as const, count: '1189장' },
                    ].map(preset => (
                        <button
                            key={preset.type}
                            onClick={() => applyPreset(preset.type)}
                            className="px-4 py-1.5 rounded-xl text-xs border border-white/10 text-zinc-400 hover:border-primary/40 hover:text-primary transition-all"
                        >
                            {preset.label} <span className="text-zinc-600">({preset.count})</span>
                        </button>
                    ))}
                    {selectedBookIds.length > 0 && (
                        <button
                            onClick={() => setSelectedBookIds([])}
                            className="px-4 py-1.5 rounded-xl text-xs border border-white/10 text-zinc-600 hover:border-red-500/30 hover:text-red-400 transition-all"
                        >
                            초기화
                        </button>
                    )}
                </div>

                {/* 구약 */}
                <BookSelector
                    label="구약 (Old Testament)"
                    books={OT_BOOKS}
                    selectedIds={selectedBookIds}
                    onToggle={toggleBook}
                    theme="indigo"
                />

                {/* 신약 */}
                <BookSelector
                    label="신약 (New Testament)"
                    books={NT_BOOKS}
                    selectedIds={selectedBookIds}
                    onToggle={toggleBook}
                    theme="rose"
                />
            </div>

            <button
                onClick={handleSubmit}
                disabled={saving || !title.trim() || selectedBookIds.length === 0}
                className="w-full py-3 rounded-2xl bg-primary hover:bg-primary/90 text-white text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_0_20px_hsl(var(--primary)/0.4)]"
            >
                {saving ? "생성 중..." : "플랜 생성하기"}
            </button>
        </div>
    );
}

function BookSelector({ label, books, selectedIds, onToggle, theme }: {
    label: string;
    books: typeof BIBLE_BOOKS;
    selectedIds: number[];
    onToggle: (id: number) => void;
    theme: 'indigo' | 'rose';
}) {
    const [expanded, setExpanded] = useState(false);
    const selectedInGroup = books.filter(b => selectedIds.includes(b.id)).length;

    const colors = theme === 'rose'
        ? { count: 'text-rose-400', selected: 'bg-rose-500/20 text-rose-400 border-rose-500/30' }
        : { count: 'text-indigo-400', selected: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30' };

    return (
        <div className="border border-white/5 rounded-2xl overflow-hidden">
            <button
                onClick={() => setExpanded(v => !v)}
                className="w-full flex items-center justify-between px-4 py-3 text-sm text-zinc-400 hover:text-white hover:bg-white/3 transition-all"
            >
                <span>{label}</span>
                <div className="flex items-center gap-2">
                    {selectedInGroup > 0 && (
                        <span className={cn("text-xs", colors.count)}>{selectedInGroup}/{books.length}</span>
                    )}
                    {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
            </button>
            {expanded && (
                <div className="px-4 pb-4 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 border-t border-white/5 pt-3">
                    {books.map(book => {
                        const isSelected = selectedIds.includes(book.id);
                        return (
                            <button
                                key={book.id}
                                onClick={() => onToggle(book.id)}
                                className={cn(
                                    "px-2 py-1.5 rounded-xl text-xs transition-all border",
                                    isSelected
                                        ? colors.selected
                                        : "bg-white/5 text-zinc-500 border-transparent hover:border-white/10 hover:text-white"
                                )}
                            >
                                {book.name}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

function PlanRow({ plan, onRefresh }: { plan: Plan; onRefresh: () => void }) {
    const [expanded, setExpanded] = useState(false);
    const [standings, setStandings] = useState<any[]>([]);
    const [loadingStandings, setLoadingStandings] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    const handleDelete = async () => {
        setShowDeleteDialog(false);

        setDeleting(true);
        try {
            const res = await fetch(`/api/admin/plans/${plan.id}`, {
                method: 'DELETE',
            });

            if (res.ok) {
                toast.success('플랜이 삭제되었습니다.');
                onRefresh();
            } else {
                const err = await res.json();
                toast.error(err.error || '플랜 삭제 중 오류가 발생했습니다.');
            }
        } catch (error) {
            console.error('Delete error:', error);
            toast.error('플랜 삭제 중 오류가 발생했습니다.');
        } finally {
            setDeleting(false);
        }
    };

    const loadStandings = async () => {
        if (standings.length > 0) { setExpanded(v => !v); return; }
        setLoadingStandings(true);
        setExpanded(true);
        try {
            const res = await fetch(`/api/admin/plans/${plan.id}/standings`);
            if (res.ok) {
                const data = await res.json();
                setStandings(data.standings || []);
            }
        } finally {
            setLoadingStandings(false);
        }
    };

    const bookNames = BIBLE_BOOKS.filter(b => plan.book_ids.includes(b.id)).map(b => b.name);
    const displayBooks = bookNames.slice(0, 3).join(', ') + (bookNames.length > 3 ? ` 외 ${bookNames.length - 3}권` : '');

    return (
        <div className="glass-dark border border-white/5 rounded-[2rem] overflow-hidden">
            <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                            <h3 className="text-white">{plan.title}</h3>
                            {!plan.is_active && (
                                <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-500">종료됨</span>
                            )}
                        </div>
                        <p className="text-xs text-zinc-600 truncate">
                            <BookOpen className="w-3 h-3 inline mr-1" />
                            {displayBooks}
                            <span className="ml-2 text-zinc-700">{plan.total_chapters}장</span>
                        </p>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-zinc-500 shrink-0">
                        <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5" />
                            {plan.participant_count}명
                        </span>
                        <span className="flex items-center gap-1">
                            <Trophy className="w-3.5 h-3.5 text-yellow-500" />
                            {plan.completed_count}명 완독
                        </span>
                        <div className="flex items-center gap-1.5 ml-2">
                            <button
                                onClick={() => setShowDeleteDialog(true)}
                                disabled={deleting}
                                title="플랜 삭제"
                                className="p-2 rounded-xl text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-50"
                            >
                                {deleting ? <RefreshCw className="w-4 h-4 animate-spin text-zinc-500" /> : <Trash2 className="w-4 h-4" />}
                            </button>

                            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                                <DialogContent className="glass-dark border-white/10 sm:rounded-[2rem]">
                                    <DialogHeader>
                                        <DialogTitle className="text-white">플랜 삭제</DialogTitle>
                                        <DialogDescription className="text-zinc-400">
                                            &apos;{plan.title}&apos; 플랜을 삭제하시겠습니까?<br />
                                            참가자 기록과 진행 현황이 모두 삭제되며 복구할 수 없습니다.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <DialogFooter className="gap-2 mt-4">
                                        <Button
                                            variant="ghost"
                                            onClick={() => setShowDeleteDialog(false)}
                                            className="rounded-xl text-zinc-400 hover:text-white hover:bg-white/5"
                                        >
                                            취소
                                        </Button>
                                        <Button
                                            variant="destructive"
                                            onClick={handleDelete}
                                            disabled={deleting}
                                            className="rounded-xl bg-red-500/80 hover:bg-red-500 text-white"
                                        >
                                            {deleting ? "삭제 중..." : "플랜 삭제"}
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>

                            <button
                                onClick={loadStandings}
                                className="p-2 rounded-xl border border-white/10 text-zinc-400 hover:text-white hover:border-white/20 transition-all"
                            >
                                {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {expanded && (
                <div className="border-t border-white/5 p-5 animate-in fade-in duration-300">
                    {loadingStandings ? (
                        <div className="py-4 text-center text-zinc-500 text-sm">
                            <RefreshCw className="w-4 h-4 animate-spin inline mr-2" />
                            순위 불러오는 중...
                        </div>
                    ) : standings.length === 0 ? (
                        <p className="text-zinc-600 text-sm text-center py-4">아직 참가자가 없습니다.</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="text-left text-xs text-zinc-600 uppercase tracking-wide">
                                        <th className="pb-3 pr-4 w-10">순위</th>
                                        <th className="pb-3 pr-4">이름</th>
                                        <th className="pb-3 pr-4">진행률</th>
                                        <th className="pb-3">완독 시간</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {standings.map((s: any, i: number) => (
                                        <tr key={s.user_id} className="text-sm">
                                            <td className={cn(
                                                "py-3 pr-4 font-mono",
                                                s.completed_at && i === 0 ? "text-yellow-400" :
                                                s.completed_at && i === 1 ? "text-zinc-300" :
                                                s.completed_at && i === 2 ? "text-orange-400" : "text-zinc-600"
                                            )}>
                                                {s.completed_at ? `${i + 1}위` : '-'}
                                            </td>
                                            <td className="py-3 pr-4 text-white">{s.full_name}</td>
                                            <td className="py-3 pr-4">
                                                <span className="text-zinc-300">{s.progress_pct}%</span>
                                                <span className="text-zinc-600 text-xs font-mono ml-2">{s.completed_chapters}/{s.total_chapters}</span>
                                            </td>
                                            <td className="py-3">
                                                {s.completed_at ? (
                                                    <span className="text-yellow-400 font-mono text-xs">{formatTimestampKST(s.completed_at)}</span>
                                                ) : (
                                                    <span className="text-zinc-600">진행 중</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
