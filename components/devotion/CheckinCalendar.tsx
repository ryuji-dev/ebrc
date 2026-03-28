"use client";

import { useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday } from "date-fns";
import { ko } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface CheckinCalendarProps {
  checkinDates: string[]; // YYYY-MM-DD
  onDateClick: (date: string) => void;
}

export function CheckinCalendar({ checkinDates, onDateClick }: CheckinCalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // 캘린더 앞뒤 빈 칸 계산 (주일 시작 기준)
  const startDay = monthStart.getDay(); // 0(주일) ~ 6(토)
  const prefixDays = startDay;

  const nextMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  const prevMonth = () => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));

  const isChecked = (date: Date) => {
    const dateStr = format(date, "yyyy-MM-dd");
    return checkinDates.includes(dateStr);
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-8 px-2">
        <h2 className="text-2xl text-white">
          {format(currentMonth, "yyyy년 M월", { locale: ko })}
        </h2>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={prevMonth}
            className="rounded-xl border-white/5 bg-white/5 hover:bg-white/10 text-white"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={nextMonth}
            className="rounded-xl border-white/5 bg-white/5 hover:bg-white/10 text-white"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 mb-2">
        {["주일", "월", "화", "수", "목", "금", "토"].map((day) => (
          <div
            key={day}
            className={cn(
              "text-center text-xs uppercase tracking-widest py-3",
              day === "주일" ? "text-rose-400" : day === "토" ? "text-indigo-400" : "text-zinc-500"
            )}
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: prefixDays }).map((_, i) => (
          <div key={`empty-${i}`} className="h-16 md:h-24 rounded-2xl bg-white/[0.02]" />
        ))}

        {days.map((day) => {
          const checked = isChecked(day);
          const today = isToday(day);

          return (
            <button
              key={day.toString()}
              onClick={() => onDateClick(format(day, "yyyy-MM-dd"))}
              className={cn(
                "h-16 md:h-24 flex flex-col items-center justify-center rounded-2xl transition-all duration-300 relative group overflow-hidden",
                today
                  ? "bg-primary/20 border border-primary/40 shadow-[0_0_20px_rgba(124,58,237,0.1)]"
                  : "bg-white/[0.03] border border-white/5 hover:bg-white/[0.08] hover:border-white/10",
                checked && !today && "bg-primary/10 border-primary/20"
              )}
            >
              <span className={cn(
                "text-lg transition-colors duration-300",
                today
                  ? "text-primary"
                  : day.getDay() === 0
                    ? "text-rose-400/80 group-hover:text-rose-400"
                    : day.getDay() === 6
                      ? "text-indigo-400/80 group-hover:text-indigo-400"
                      : "text-zinc-400 group-hover:text-white",
                checked && "text-white"
              )}>
                {format(day, "d")}
              </span>

              {checked && (
                <div className="mt-2 flex gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(124,58,237,0.8)]" />
                </div>
              )}

              {/* Hover highlight effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
