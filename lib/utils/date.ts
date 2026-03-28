import { format, parseISO, formatDistanceToNow, differenceInDays } from 'date-fns';
import { ko } from 'date-fns/locale';

/**
 * 날짜를 YYYY-MM-DD 형식으로 포맷
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'yyyy-MM-dd');
}

/**
 * 날짜를 한글 형식으로 포맷 (예: 2026년 1월 1일)
 */
export function formatDateKorean(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  const formatted = format(d, 'yyyy년 M월 d일 (E)', { locale: ko });
  return formatted.replace('(일)', '(주일)');
}

/**
 * 상대 시간 표시 (예: 3일 전)
 */
export function formatRelative(date: Date | string): string {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return formatDistanceToNow(d, { addSuffix: true, locale: ko });
}

/**
 * 한국 표준시(KST, UTC+9) 기준 현재 날짜를 YYYY-MM-DD로 반환
 * 서버(UTC)와 클라이언트(KST) 모두에서 일관된 날짜를 반환하기 위해 사용
 */
export function getTodayKST(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

/**
 * 한국 표준시(KST) 기준 현재 연월을 YYYY-MM으로 반환
 */
export function getThisMonthKST(): string {
  return getTodayKST().slice(0, 7);
}

/**
 * 한국 표준시(KST) 기준 이번 달 첫날을 YYYY-MM-DD로 반환
 */
export function getFirstDayOfMonthKST(): string {
  const today = getTodayKST(); // YYYY-MM-DD
  return today.slice(0, 7) + '-01';
}

/**
 * 오늘 날짜를 YYYY-MM-DD 형식으로 반환 (KST 기준)
 * @deprecated getTodayKST()를 사용하세요
 */
export function getToday(): string {
  return getTodayKST();
}


/**
 * 두 날짜 사이의 일수 계산
 */
export function getDaysBetween(start: Date | string, end: Date | string): number {
  const startDate = typeof start === 'string' ? parseISO(start) : start;
  const endDate = typeof end === 'string' ? parseISO(end) : end;
  return differenceInDays(endDate, startDate);
}

/**
 * 날짜가 오늘인지 확인
 */
export function isToday(date: string): boolean {
  return date === getToday();
}

/**
 * 날짜 배열을 생성 (start부터 end까지)
 */
export function getDateRange(start: Date, end: Date): string[] {
  const dates: string[] = [];
  const current = new Date(start);

  while (current <= end) {
    dates.push(formatDate(current));
    current.setDate(current.getDate() + 1);
  }

  return dates;
}
