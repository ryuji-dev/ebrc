'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CheckinCalendar } from './CheckinCalendar';
import { CheckinModal } from './CheckinModal';

interface DevotionRecord {
  id: string;
  durationMinutes?: number;
  memo?: string;
  plannedStartTime?: string;
  plannedEndTime?: string;
  startTime?: string;
  endTime?: string;
}

interface CheckinClientProps {
  checkinDates: string[];
  initialCheckinDetails: Record<string, DevotionRecord[]>;
}

export function CheckinClient({ checkinDates, initialCheckinDetails }: CheckinClientProps) {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleDateClick = (date: string) => {
    setSelectedDate(date);
    setIsModalOpen(true);
  };

  const handleSuccess = () => {
    router.refresh();
  };

  return (
    <>
      <CheckinCalendar
        checkinDates={checkinDates}
        onDateClick={handleDateClick}
      />

      {selectedDate && (
        <CheckinModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          date={selectedDate}
          initialData={initialCheckinDetails[selectedDate]}
          onSuccess={handleSuccess}
        />
      )}
    </>
  );
}
