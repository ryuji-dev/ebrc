'use client';

import { useState, useEffect, useCallback } from 'react';
import { formatTimestampKST } from '@/lib/utils/date';
import { Swords, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Standing {
    user_id: string;
    full_name: string;
    ot_progress: number;
    nt_progress: number;
    total_progress: number;
    ot_progress_pct: number;
    nt_progress_pct: number;
    total_progress_pct: number;
    ot_completed_at: string | null;
    nt_completed_at: string | null;
    total_completed_at: string | null;
    status: string;
}

interface RaceStandingsProps {
    year?: number;
}

export function RaceStandings({ year = 2026 }: RaceStandingsProps) {
    const [standings, setStandings] = useState<Standing[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchStandings = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/admin/race-standings?year=${year}`);
            if (res.ok) {
                const data = await res.json();
                setStandings(data.standings || []);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [year]);

    useEffect(() => {
        fetchStandings();
    }, [fetchStandings]);

    const getRankLabel = (index: number, standing: Standing) => {
        if (standing.total_completed_at) return `${index + 1}위`;
        return '-';
    };

    const getStatusBadge = (standing: Standing) => {
        if (standing.status === 'completed') {
            return <span className="px-2 py-0.5 rounded-full text-xs bg-green-500/20 text-green-400 border border-green-500/20">완독</span>;
        }
        return <span className="px-2 py-0.5 rounded-full text-xs bg-blue-500/20 text-blue-400 border border-blue-500/20">진행 중</span>;
    };

    const completedCount = standings.filter(s => s.status === 'completed').length;

    return (
        <div className="space-y-6">
            {/* 헤더 */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-primary/20 flex items-center justify-center">
                        <Swords className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-white text-lg tracking-tight">{year}년 통독 레이스 순위</h2>
                        <p className="text-zinc-500 text-xs">참가자 {standings.length}명 · 완독자 {completedCount}명</p>
                    </div>
                </div>
                <button
                    onClick={fetchStandings}
                    disabled={loading}
                    className="p-2 rounded-xl text-zinc-500 hover:text-white hover:bg-white/5 transition-all disabled:opacity-50"
                    title="새로고침"
                >
                    <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
                </button>
            </div>

            {loading ? (
                <div className="py-16 flex items-center justify-center text-zinc-500">
                    <RefreshCw className="w-5 h-5 animate-spin mr-2" />
                    불러오는 중...
                </div>
            ) : standings.length === 0 ? (
                <div className="py-16 text-center text-zinc-500">
                    아직 참가자가 없습니다.
                </div>
            ) : (
                <>
                    {/* 데스크탑 테이블 */}
                    <div className="hidden md:block overflow-hidden rounded-[2rem] border border-white/5">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-white/5 bg-white/2">
                                    <th className="px-6 py-4 text-left text-xs text-zinc-500 uppercase tracking-wide w-16">순위</th>
                                    <th className="px-6 py-4 text-left text-xs text-zinc-500 uppercase tracking-wide">이름</th>
                                    <th className="px-6 py-4 text-left text-xs text-zinc-500 uppercase tracking-wide">진행률</th>
                                    <th className="px-6 py-4 text-left text-xs text-zinc-500 uppercase tracking-wide">구약 완독</th>
                                    <th className="px-6 py-4 text-left text-xs text-zinc-500 uppercase tracking-wide">신약 완독</th>
                                    <th className="px-6 py-4 text-left text-xs text-zinc-500 uppercase tracking-wide">전체 완독</th>
                                    <th className="px-6 py-4 text-left text-xs text-zinc-500 uppercase tracking-wide">상태</th>
                                </tr>
                            </thead>
                            <tbody>
                                {standings.map((standing, index) => (
                                    <tr
                                        key={standing.user_id}
                                        className={cn(
                                            "border-b border-white/5 last:border-b-0 transition-colors hover:bg-white/2",
                                            standing.status === 'completed' && "bg-yellow-500/3"
                                        )}
                                    >
                                        <td className="px-6 py-4">
                                            <span className={cn(
                                                "text-sm font-mono",
                                                standing.total_completed_at && index === 0 ? "text-yellow-400" :
                                                standing.total_completed_at && index === 1 ? "text-zinc-300" :
                                                standing.total_completed_at && index === 2 ? "text-orange-400" :
                                                "text-zinc-600"
                                            )}>
                                                {getRankLabel(index, standing)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-white">{standing.full_name}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="space-y-1.5 min-w-[120px]">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-white text-sm">{standing.total_progress_pct}%</span>
                                                    <span className="text-zinc-600 text-xs font-mono">{standing.total_progress}/1189</span>
                                                </div>
                                                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-primary rounded-full transition-all duration-1000"
                                                        style={{ width: `${standing.total_progress_pct}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {standing.ot_completed_at ? (
                                                <span className="text-indigo-400 font-mono text-xs">{formatTimestampKST(standing.ot_completed_at)}</span>
                                            ) : (
                                                <span className="text-zinc-600 text-xs">{standing.ot_progress_pct}%</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {standing.nt_completed_at ? (
                                                <span className="text-rose-400 font-mono text-xs">{formatTimestampKST(standing.nt_completed_at)}</span>
                                            ) : (
                                                <span className="text-zinc-600 text-xs">{standing.nt_progress_pct}%</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {standing.total_completed_at ? (
                                                <span className="text-yellow-400 font-mono text-xs">{formatTimestampKST(standing.total_completed_at)}</span>
                                            ) : (
                                                <span className="text-zinc-600 text-xs">-</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {getStatusBadge(standing)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* 모바일 카드 */}
                    <div className="md:hidden space-y-3">
                        {standings.map((standing, index) => (
                            <div
                                key={standing.user_id}
                                className={cn(
                                    "glass-dark border border-white/5 rounded-[2rem] p-5 space-y-4",
                                    standing.status === 'completed' && "border-yellow-500/20"
                                )}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className={cn(
                                            "text-lg font-mono",
                                            standing.total_completed_at && index === 0 ? "text-yellow-400" :
                                            standing.total_completed_at && index === 1 ? "text-zinc-300" :
                                            standing.total_completed_at && index === 2 ? "text-orange-400" :
                                            "text-zinc-600"
                                        )}>
                                            {getRankLabel(index, standing)}
                                        </span>
                                        <span className="text-white">{standing.full_name}</span>
                                    </div>
                                    {getStatusBadge(standing)}
                                </div>
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <span className="text-zinc-400 text-sm">{standing.total_progress_pct}%</span>
                                        <span className="text-zinc-600 text-xs font-mono">{standing.total_progress}/1189</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-primary rounded-full"
                                            style={{ width: `${standing.total_progress_pct}%` }}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 gap-2 text-xs">
                                    <div>
                                        <p className="text-zinc-600 mb-0.5">구약</p>
                                        {standing.ot_completed_at
                                            ? <p className="text-indigo-400 font-mono leading-tight">{formatTimestampKST(standing.ot_completed_at)}</p>
                                            : <p className="text-zinc-600">{standing.ot_progress_pct}%</p>
                                        }
                                    </div>
                                    <div>
                                        <p className="text-zinc-600 mb-0.5">신약</p>
                                        {standing.nt_completed_at
                                            ? <p className="text-rose-400 font-mono leading-tight">{formatTimestampKST(standing.nt_completed_at)}</p>
                                            : <p className="text-zinc-600">{standing.nt_progress_pct}%</p>
                                        }
                                    </div>
                                    <div>
                                        <p className="text-zinc-600 mb-0.5">전체</p>
                                        {standing.total_completed_at
                                            ? <p className="text-yellow-400 font-mono leading-tight">{formatTimestampKST(standing.total_completed_at)}</p>
                                            : <p className="text-zinc-600">-</p>
                                        }
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
