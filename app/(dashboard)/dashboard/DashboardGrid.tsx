'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Book, BookOpen, Trophy, Flame, LandPlot, Settings2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { CustomizeDialog } from './CustomizeDialog';

interface DashboardGridProps {
  stats: {
    todayCheckin: boolean;
    monthCheckins: number;
    overallPlanProgress: number;
    activePlansCount: number;
    readingProgress: number;
    cumulativeReads: number;
    currentYear: number;
  };
}

export type WidgetId = 
  | 'today-devotion' 
  | 'monthly-activity' 
  | 'plan-status' 
  | 'annual-progress' 
  | 'cumulative-completion';

export interface WidgetSetting {
  id: WidgetId;
  visible: boolean;
  label: string;
}

const DEFAULT_SETTINGS: WidgetSetting[] = [
  { id: 'today-devotion', visible: true, label: '오늘 경건시간' },
  { id: 'monthly-activity', visible: true, label: '이번 달 활동' },
  { id: 'plan-status', visible: true, label: '참여 플랜 현황' },
  { id: 'annual-progress', visible: true, label: '연간 통독 진행률' },
  { id: 'cumulative-completion', visible: true, label: '누적 완독' },
];

const STORAGE_KEY = 'dashboard-widget-settings-v1';

export function DashboardGrid({ stats }: DashboardGridProps) {
  const [settings, setSettings] = useState<WidgetSetting[]>(DEFAULT_SETTINGS);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // 기본 설정에 없는 새 위젯이 추가될 경우를 대비해 병합
        const merged = DEFAULT_SETTINGS.map(defaultWidget => {
          const found = parsed.find((p: any) => p.id === defaultWidget.id);
          return found ? { ...defaultWidget, ...found } : defaultWidget;
        });
        // 저장된 순서 유지
        const ordered = parsed
          .map((p: any) => merged.find(m => m.id === p.id))
          .filter(Boolean) as WidgetSetting[];
        
        // 누락된 신규 위젯 추가
        const missing = merged.filter(m => !ordered.find(o => o.id === m.id));
        setSettings([...ordered, ...missing]);
      } catch (e) {
        console.error('Failed to parse settings', e);
      }
    }
    setIsLoaded(true);
  }, []);

  const saveSettings = (newSettings: WidgetSetting[]) => {
    setSettings(newSettings);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newSettings));
  };

  if (!isLoaded) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 opacity-0">
        {DEFAULT_SETTINGS.map((s) => (
          <div key={s.id} className="h-32 rounded-[2rem] bg-zinc-900/50 animate-pulse" />
        ))}
      </div>
    );
  }

  const renderWidget = (id: WidgetId) => {
    switch (id) {
      case 'today-devotion':
        return (
          <Card key={id} className="glass-dark border-white/5 shadow-none overflow-hidden group hover:border-primary/30 transition-all duration-500 rounded-[2rem]">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm text-zinc-300 uppercase tracking-tight mb-2">
                <Book className="w-4 h-4 text-primary" />
                오늘 경건시간
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between">
                <div>
                  {stats.todayCheckin ? (
                    <div className="text-3xl text-white">완료</div>
                  ) : (
                    <div className="text-3xl text-zinc-800">미완료</div>
                  )}
                </div>
                <div className={cn(
                  "w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500",
                  stats.todayCheckin
                    ? "bg-primary text-white shadow-[0_0_20px_rgba(124,58,237,0.3)]"
                    : "bg-zinc-900 text-zinc-700 group-hover:bg-primary group-hover:text-white group-hover:shadow-[0_0_20px_rgba(124,58,237,0.4)]"
                )}>
                  <Trophy className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      case 'monthly-activity':
        return (
          <Card key={id} className="glass-dark border-white/5 shadow-none overflow-hidden group hover:border-orange-500/30 transition-all duration-500 rounded-[2rem]">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm text-zinc-300 uppercase tracking-tight mb-2">
                <Flame className="w-4 h-4 text-orange-500" />
                이번 달 활동
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between">
                <div className="text-3xl text-white tracking-tight">{stats.monthCheckins || 0}회</div>
                <div className="w-12 h-12 rounded-2xl bg-orange-500/10 text-orange-500 flex items-center justify-center transition-all duration-500 group-hover:bg-orange-500 group-hover:text-white group-hover:shadow-[0_0_20px_rgba(249,115,22,0.4)]">
                  <Flame className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      case 'plan-status':
        return (
          <Card key={id} className="glass-dark border-white/5 shadow-none overflow-hidden group hover:border-emerald-500/30 transition-all duration-500 rounded-[2rem]">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm text-zinc-300 uppercase tracking-tight mb-2">
                <LandPlot className="w-4 h-4 text-emerald-500" />
                참여 플랜 현황 {stats.activePlansCount > 1 && <span className="text-[10px] opacity-50 ml-1">({stats.activePlansCount})</span>}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between">
                <div className="text-3xl text-white tracking-tight">{stats.overallPlanProgress}%</div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center transition-all duration-500 group-hover:bg-emerald-500 group-hover:text-white group-hover:shadow-[0_0_20px_rgba(16,185,129,0.4)]">
                  <LandPlot className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      case 'annual-progress':
        return (
          <Card key={id} className="glass-dark border-white/5 shadow-none overflow-hidden group hover:border-blue-500/30 transition-all duration-500 rounded-[2rem]">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm text-zinc-300 uppercase tracking-tight mb-2">
                <BookOpen className="w-4 h-4 text-blue-500" />
                {stats.currentYear}년 통독
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between">
                <div className="text-3xl text-white tracking-tight">{stats.readingProgress}%</div>
                <div className="w-12 h-12 rounded-2xl bg-blue-500/10 text-blue-500 flex items-center justify-center group-hover:bg-blue-500 group-hover:text-white transition-all duration-500 group-hover:shadow-[0_0_20px_rgba(59,130,246,0.4)]">
                  <BookOpen className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      case 'cumulative-completion':
        return (
          <Card key={id} className="glass-dark border-white/5 shadow-none overflow-hidden group hover:border-yellow-500/30 transition-all duration-500 rounded-[2rem]">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm text-zinc-300 uppercase tracking-tight mb-2">
                <Trophy className="w-4 h-4 text-yellow-500" />
                누적 완독
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between">
                <div className="text-3xl text-white tracking-tight">{stats.cumulativeReads}회</div>
                <div className="w-12 h-12 rounded-2xl bg-yellow-500/10 text-yellow-500 flex items-center justify-center transition-all duration-500 group-hover:bg-yellow-500 group-hover:text-white group-hover:shadow-[0_0_20px_rgba(234,179,8,0.4)]">
                  <Trophy className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        );
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <h2 className="text-lg font-semibold text-zinc-200">나의 현황</h2>
        <CustomizeDialog settings={settings} onSave={saveSettings} />
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {settings
          .filter(s => s.visible)
          .map(s => renderWidget(s.id))
        }
      </div>
    </div>
  );
}
