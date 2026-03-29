'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Settings2, ChevronUp, ChevronDown, Eye, EyeOff, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { WidgetSetting } from './DashboardGrid';

interface CustomizeDialogProps {
  settings: WidgetSetting[];
  onSave: (newSettings: WidgetSetting[]) => void;
}

export function CustomizeDialog({ settings: initialSettings, onSave }: CustomizeDialogProps) {
  const [tempSettings, setTempSettings] = useState<WidgetSetting[]>(initialSettings);
  const [open, setOpen] = useState(false);

  const handleToggle = (id: string) => {
    setTempSettings(prev =>
      prev.map(s => (s.id === id ? { ...s, visible: !s.visible } : s))
    );
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= tempSettings.length) return;

    const newSettings = [...tempSettings];
    const [movedItem] = newSettings.splice(index, 1);
    newSettings.splice(newIndex, 0, movedItem);
    setTempSettings(newSettings);
  };

  const handleApply = () => {
    onSave(tempSettings);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={(val) => {
      setOpen(val);
      if (val) setTempSettings(initialSettings);
    }}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white hover:bg-white/5 gap-2">
          <Settings2 className="w-4 h-4" />
          <span className="hidden sm:inline">대시보드 설정</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] glass-dark border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-medium">대시보드 편집</DialogTitle>
          <p className="text-sm text-zinc-400 mt-1">위젯의 순서를 변경하거나 숨길 수 있습니다.</p>
        </DialogHeader>

        <div className="space-y-3 py-4">
          {tempSettings.map((widget, index) => (
            <div
              key={widget.id}
              className={cn(
                "flex items-center justify-between p-3 rounded-2xl border transition-all duration-300",
                widget.visible 
                  ? "bg-white/5 border-white/10" 
                  : "bg-black/20 border-white/5 opacity-50"
              )}
            >
              <div className="flex items-center gap-3">
                <GripVertical className="w-4 h-4 text-zinc-600" />
                <span className="font-medium text-sm">{widget.label}</span>
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-zinc-400 hover:text-white"
                  onClick={() => handleMove(index, 'up')}
                  disabled={index === 0}
                >
                  <ChevronUp className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-zinc-400 hover:text-white"
                  onClick={() => handleMove(index, 'down')}
                  disabled={index === tempSettings.length - 1}
                >
                  <ChevronDown className="w-4 h-4" />
                </Button>
                <div className="w-px h-4 bg-white/10 mx-1" />
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "h-8 w-8 transition-colors",
                    widget.visible ? "text-primary" : "text-zinc-600"
                  )}
                  onClick={() => handleToggle(widget.id)}
                >
                  {widget.visible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          ))}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="ghost" onClick={() => setOpen(false)} className="text-zinc-400">
            취소
          </Button>
          <Button onClick={handleApply} className="bg-primary hover:bg-primary/90">
            저장하기
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
