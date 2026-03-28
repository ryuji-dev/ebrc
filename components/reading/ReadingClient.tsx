'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { CheckCircle2, Circle, ChevronDown, ChevronUp } from 'lucide-react';
import { format, isToday } from 'date-fns';
import { ko } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface ReadingClientProps {
  mode: 'create' | 'view';
  templateId?: string;
  year?: number;
  planId?: string;
  items?: any[];
  completedDates?: string[];
}

export function ReadingClient({ mode, templateId, year, planId, items, completedDates = [] }: ReadingClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const startPlan = async () => {
    setLoading(true);
    try {
      const resp = await fetch('/api/reading/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ templateId, year }),
      });
      if (resp.ok) router.refresh();
    } finally {
      setLoading(false);
    }
  };

  const toggleComplete = async (date: string) => {
    const isCompleted = completedDates.includes(date);

    try {
      const resp = await fetch('/api/reading/complete', {
        method: isCompleted ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId, date }),
      });
      if (resp.ok) router.refresh();
    } catch (err) {
      console.error(err);
    }
  };

  if (mode === 'create') {
    return (
      <Button onClick={startPlan} disabled={loading}>
        {loading ? '시작 중...' : '시작하기'}
      </Button>
    );
  }

  // 정렬 및 필터링 (가까운 날짜 위주)
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const displayItems = showAll ? items : items?.filter(item => {
    const diff = Math.abs(new Date(item.date).getTime() - new Date(todayStr).getTime());
    return diff < 1000 * 60 * 60 * 24 * 7; // 최근 1주일
  });

  return (
    <div className="space-y-4">
      <div className="grid gap-3">
        {displayItems?.map((item) => {
          const isDone = completedDates.includes(item.date);
          const isTdy = item.date === todayStr;

          return (
            <div
              key={item.id}
              className={cn(
                "p-4 rounded-xl border flex items-center justify-between transition-all",
                isDone ? "bg-gray-50 border-gray-100 opacity-70" : "bg-white border-gray-200",
                isTdy && !isDone && "ring-2 ring-primary ring-offset-2"
              )}
            >
              <div className="flex items-center gap-4">
                <button
                  onClick={() => toggleComplete(item.date)}
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
                    isDone ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400 hover:bg-gray-200"
                  )}
                >
                  {isDone ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                </button>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400">DAY {item.day_number}</span>
                    <span className="text-sm font-medium text-gray-500">
                      {format(new Date(item.date), 'M월 d일 (E)', { locale: ko })}
                    </span>
                    {isTdy && <span className="bg-primary text-white text-[10px] px-1.5 py-0.5 rounded uppercase">Today</span>}
                  </div>
                  <h4 className={cn("text-lg mt-1", isDone && "line-through text-gray-400")}>
                    {item.passages}
                  </h4>
                  {item.notes && <p className="text-xs text-gray-400 mt-1">{item.notes}</p>}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Button
        variant="ghost"
        className="w-full text-gray-400"
        onClick={() => setShowAll(!showAll)}
      >
        {showAll ? (
          <><ChevronUp className="w-4 h-4 mr-2" /> 요약 보기</>
        ) : (
          <><ChevronDown className="w-4 h-4 mr-2" /> 전체 일정 보기</>
        )}
      </Button>
    </div>
  );
}
