'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { formatDateKorean } from '@/lib/utils/date';

interface CheckinModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: string;
  initialData?: {
    id: string;
    durationMinutes?: number;
    memo?: string;
    plannedStartTime?: string;
    plannedEndTime?: string;
    startTime?: string;
    endTime?: string;
  }[];
  onSuccess: () => void;
}

export function CheckinModal({
  isOpen,
  onClose,
  date,
  initialData = [],
  onSuccess
}: CheckinModalProps) {
  const [id, setId] = useState<string | null>(null);
  const [duration, setDuration] = useState<string>('');
  const [memo, setMemo] = useState('');
  const [plannedStartTime, setPlannedStartTime] = useState('00:00');
  const [plannedEndTime, setPlannedEndTime] = useState('00:00');
  const [startTime, setStartTime] = useState('00:00');
  const [endTime, setEndTime] = useState('00:00');
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(initialData.length === 0);

  // 시간 계산 로직
  const calculateDuration = (start: string, end: string) => {
    if (!start || !end || start === '00:00' && end === '00:00') {
      setDuration('');
      return;
    }
    const [sH, sM] = start.split(':').map(Number);
    const [eH, eM] = end.split(':').map(Number);
    let diff = (eH * 60 + eM) - (sH * 60 + sM);
    if (diff < 0) diff += 24 * 60; // 다음날로 넘어가는 경우 대비
    setDuration(diff.toString());
  };

  const resetForm = () => {
    setId(null);
    setDuration('');
    setMemo('');
    setPlannedStartTime('00:00');
    setPlannedEndTime('00:00');
    setStartTime('00:00');
    setEndTime('00:00');
    setShowForm(false);
  };

  const handleEdit = (record: any) => {
    setId(record.id);
    setDuration(record.durationMinutes?.toString() || '');
    setMemo(record.memo || '');
    setPlannedStartTime(record.plannedStartTime || '00:00');
    setPlannedEndTime(record.plannedEndTime || '00:00');
    setStartTime(record.startTime || '00:00');
    setEndTime(record.endTime || '00:00');
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const resp = await fetch('/api/devotion/checkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          checkinDate: date,
          durationMinutes: duration ? parseInt(duration) : null,
          memo: memo || null,
          plannedStartTime: plannedStartTime || null,
          plannedEndTime: plannedEndTime || null,
          startTime: startTime || null,
          endTime: endTime || null,
        }),
      });

      if (resp.ok) {
        onSuccess();
        resetForm();
        if (initialData.length === 0) onClose();
      } else {
        const data = await resp.json();
        alert('에러 발생: ' + data.error);
      }
    } catch (err) {
      console.error(err);
      alert('오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (targetId: string) => {
    if (!confirm('본 기록을 삭제하시겠습니까?')) return;
    setLoading(true);

    try {
      const resp = await fetch(`/api/devotion/checkin?id=${targetId}`, {
        method: 'DELETE',
      });

      if (resp.ok) {
        onSuccess();
        if (id === targetId) resetForm();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const TimeSelect = ({ label, value, onChange }: { label: string, value: string, onChange: (v: string) => void }) => {
    const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
    const minutes = Array.from({ length: 12 }, (_, i) => (i * 5).toString().padStart(2, '0'));
    const [h, m] = value && value.includes(':') ? value.split(':') : ['00', '00'];

    return (
      <div className="space-y-2">
        <label className="text-xs text-zinc-500 uppercase ml-1">{label}</label>
        <div className="flex gap-2">
          <select
            value={h}
            onChange={(e) => onChange(`${e.target.value}:${m}`)}
            className="flex-1 bg-white/5 border border-white/10 rounded-xl h-12 text-white px-3 appearance-none focus:outline-none focus:border-primary/50"
          >
            {hours.map(hr => <option key={hr} value={hr} className="bg-zinc-900">{hr}시</option>)}
          </select>
          <select
            value={m}
            onChange={(e) => onChange(`${h}:${e.target.value}`)}
            className="flex-1 bg-white/5 border border-white/10 rounded-xl h-12 text-white px-3 appearance-none focus:outline-none focus:border-primary/50"
          >
            {minutes.map(min => <option key={min} value={min} className="bg-zinc-900">{min}분</option>)}
          </select>
        </div>
      </div>
    );
  };

  const formatTimeShort = (timeStr?: string | null) => {
    if (!timeStr) return '';
    return timeStr.substring(0, 5); // HH:MM
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[540px] bg-[#0c0c0e] border border-white/20 p-0 overflow-hidden rounded-[2.5rem] shadow-[0_0_50px_rgba(0,0,0,0.6)]">
        <div className="p-8 space-y-8 max-h-[90vh] overflow-y-auto custom-scrollbar">
          <DialogHeader className="space-y-3">
            <DialogTitle className="text-3xl text-white tracking-tight">
              {formatDateKorean(date)}
            </DialogTitle>
            <DialogDescription className="text-zinc-400 text-lg">
              이날의 경건 시간을 기록하세요.
            </DialogDescription>
          </DialogHeader>

          {/* 기존 기록 목록 */}
          {initialData.length > 0 && (
            <div className="space-y-4">
              <h4 className="text-sm text-zinc-500 uppercase tracking-wider ml-1">저장된 기록</h4>
              <div className="space-y-3">
                {initialData.map((record: any) => (
                  <div key={record.id} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between group hover:border-primary/40 transition-all">
                    <div className="space-y-1">
                      <div className="text-white font-medium">
                        {(record.startTime && record.startTime !== '00:00') || (record.endTime && record.endTime !== '00:00')
                          ? `${formatTimeShort(record.startTime)} ~ ${formatTimeShort(record.endTime)}`
                          : `${formatTimeShort(record.plannedStartTime)} ~ ${formatTimeShort(record.plannedEndTime)} (계획)`}
                        <span className="ml-2 text-primary">{record.durationMinutes || 0}분</span>
                      </div>
                      {record.memo && <div className="text-zinc-500 text-sm line-clamp-1">{record.memo}</div>}
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="sm" onClick={() => handleEdit(record)} className="h-8 w-8 p-0 text-zinc-400 hover:text-white">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                      </Button>
                      <button onClick={() => handleDelete(record.id)} className="h-8 w-8 inline-flex items-center justify-center text-zinc-400 hover:text-destructive">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              {!showForm && (
                <Button variant="outline" onClick={() => setShowForm(true)} className="w-full border-dashed border-white/20 bg-transparent hover:bg-white/5 text-zinc-400 rounded-2xl h-14">
                  + 새로운 기록 추가
                </Button>
              )}
            </div>
          )}

          {showForm && (
            <form onSubmit={handleSubmit} className="space-y-8 animate-in slide-in-from-top-4 duration-300">
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4 bg-white/5 p-5 rounded-[1.5rem] border border-white/5">
                  <div className="col-span-2 text-xs text-zinc-500 uppercase tracking-widest mb-1">📅 계획된 시간</div>
                  <TimeSelect label="계획 시작" value={plannedStartTime} onChange={setPlannedStartTime} />
                  <TimeSelect label="계획 종료" value={plannedEndTime} onChange={setPlannedEndTime} />
                </div>

                <div className="grid grid-cols-2 gap-4 bg-primary/5 p-5 rounded-[1.5rem] border border-primary/10">
                  <div className="col-span-2 flex justify-between items-center mb-1">
                    <span className="text-xs text-primary uppercase tracking-widest">✨ 실제 경건 시간</span>
                    <div className="bg-primary/20 px-3 py-1 rounded-full">
                      <span className="text-primary text-sm">{duration || '0'}분</span>
                    </div>
                  </div>
                  <TimeSelect label="실제 시작" value={startTime} onChange={(v) => { setStartTime(v); calculateDuration(v, endTime); }} />
                  <TimeSelect label="실제 종료" value={endTime} onChange={(v) => { setEndTime(v); calculateDuration(startTime, v); }} />
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="memo" className="text-sm text-zinc-400 uppercase tracking-wider ml-1">메모</Label>
                <Textarea
                  id="memo"
                  placeholder="말씀 묵상 내용이나 기도 제목 등"
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  className="bg-white/5 border-white/10 rounded-2xl min-h-[100px] text-base p-4 focus:ring-primary/20 focus:border-primary/50 text-white"
                />
              </div>

              <div className="flex gap-3 pt-6 border-t border-white/10">
                <Button type="button" variant="outline" onClick={() => initialData.length > 0 ? setShowForm(false) : onClose()} className="flex-1 border-white/10 bg-white/5 hover:bg-white/10 text-white rounded-xl h-12">
                  {initialData.length > 0 ? '취소' : '닫기'}
                </Button>
                <Button type="submit" disabled={loading} className="flex-[2] bg-primary hover:bg-primary/90 text-white rounded-xl h-12 shadow-lg shadow-primary/20">
                  {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : (id ? '기록 수정' : '기록 저장')}
                </Button>
              </div>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

