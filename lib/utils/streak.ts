import { getTodayKST } from './date';

/**
 * 연속 체크인 일수(Streak) 계산
 * @param dates 체크인 날짜 배열 (YYYY-MM-DD 형식, 정렬되어 있어야 함)
 * @returns 현재 연속 일수
 */
export function calculateCurrentStreak(dates: string[]): number {
  if (dates.length === 0) return 0;

  // 날짜를 최신순으로 정렬
  const sortedDates = [...dates].sort((a, b) => b.localeCompare(a));

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  let streak = 0;
  let checkDate = today;

  // 오늘 또는 어제부터 시작
  const latestDate = new Date(sortedDates[0]);
  latestDate.setHours(0, 0, 0, 0);

  const diffDays = Math.floor((today.getTime() - latestDate.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays > 1) {
    // 마지막 체크인이 어제보다 이전이면 streak는 0
    return 0;
  }

  if (diffDays === 1) {
    // 마지막 체크인이 어제면 어제부터 시작
    checkDate = yesterday;
  }

  // 연속 일수 계산
  for (const dateStr of sortedDates) {
    const d = new Date(dateStr);
    d.setHours(0, 0, 0, 0);

    if (d.getTime() === checkDate.getTime()) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

/**
 * 최장 연속 일수 계산
 */
export function calculateLongestStreak(dates: string[]): number {
  if (dates.length === 0) return 0;

  const sortedDates = [...dates].sort((a, b) => a.localeCompare(b));

  let longestStreak = 1;
  let currentStreak = 1;

  for (let i = 1; i < sortedDates.length; i++) {
    const prevDate = new Date(sortedDates[i - 1]);
    const currDate = new Date(sortedDates[i]);

    const diffDays = Math.floor(
      (currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 1) {
      currentStreak++;
      longestStreak = Math.max(longestStreak, currentStreak);
    } else {
      currentStreak = 1;
    }
  }

  return longestStreak;
}

/**
 * 특정 기간 내 체크인 횟수
 */
export function countCheckinsInRange(
  dates: string[],
  startDate: string,
  endDate: string
): number {
  return dates.filter(d => d >= startDate && d <= endDate).length;
}

/**
 * 이번 주 체크인 횟수 (월요일 시작)
 */
export function countThisWeek(dates: string[]): number {
  // KST 기준 오늘 날짜
  const todayStr = getTodayKST();
  const todayDate = new Date(todayStr);
  const dayOfWeek = todayDate.getDay(); // 0(일) ~ 6(토)
  const monday = new Date(todayDate);
  monday.setDate(todayDate.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  const mondayStr = monday.toISOString().split('T')[0]; // KST 기준 날짜에서 계산된 것이므로 안전

  return countCheckinsInRange(dates, mondayStr, todayStr);
}

/**
 * 이번 달 체크인 횟수
 */
export function countThisMonth(dates: string[]): number {
  // KST 기준 오늘 날짜
  const todayStr = getTodayKST();
  const firstDayStr = todayStr.slice(0, 7) + '-01'; // YYYY-MM-01

  return countCheckinsInRange(dates, firstDayStr, todayStr);
}
