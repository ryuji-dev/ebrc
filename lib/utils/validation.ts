import { z } from 'zod';

// 로그인 폼 검증
export const loginSchema = z.object({
  email: z.string().email('올바른 이메일 형식이 아닙니다'),
  password: z.string().min(1, '비밀번호를 입력하세요'),
});

// 비밀번호 변경 폼 검증
export const changePasswordSchema = z.object({
  currentPassword: z.string().optional(),
  newPassword: z
    .string()
    .min(12, '비밀번호는 최소 12자 이상이어야 합니다')
    .regex(/[A-Z]/, '대문자를 최소 1개 포함해야 합니다')
    .regex(/[a-z]/, '소문자를 최소 1개 포함해야 합니다')
    .regex(/[0-9]/, '숫자를 최소 1개 포함해야 합니다')
    .regex(/[^A-Za-z0-9]/, '특수문자를 최소 1개 포함해야 합니다'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: '비밀번호가 일치하지 않습니다',
  path: ['confirmPassword'],
});

// 경건시간 계획 검증
export const devotionPlanSchema = z.object({
  year: z.number().int().min(2024).max(2030),
  title: z.string().min(1, '제목을 입력하세요').max(100),
  description: z.string().max(500).optional(),
  frequency: z.enum(['daily', 'weekly', 'monthly']),
  targetCount: z.number().int().min(1, '목표 횟수는 1 이상이어야 합니다'),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '올바른 날짜 형식이 아닙니다'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '올바른 날짜 형식이 아닙니다'),
}).refine((data) => data.endDate >= data.startDate, {
  message: '종료일은 시작일 이후여야 합니다',
  path: ['endDate'],
});

// 체크인 검증
export const checkinSchema = z.object({
  checkinDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '올바른 날짜 형식이 아닙니다'),
  durationMinutes: z.number().int().min(1).max(999).optional(),
  memo: z.string().max(500).optional(),
  planId: z.string().uuid().optional(),
});

// 통독 플랜 생성 검증
export const readingPlanCreateSchema = z.object({
  templateId: z.string().uuid('올바른 템플릿 ID가 아닙니다'),
  year: z.number().int().min(2024).max(2030),
});

// 통독 완료 체크 검증
export const readingCompletionSchema = z.object({
  planId: z.string().uuid('올바른 플랜 ID가 아닙니다'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '올바른 날짜 형식이 아닙니다'),
  memo: z.string().max(500).optional(),
});

// 관리자 - 계정 발급 검증
export const provisionAccountSchema = z.object({
  email: z.string().email('올바른 이메일 형식이 아닙니다'),
  fullName: z.string().min(1, '이름을 입력하세요').max(50),
  role: z.enum(['user', 'leader', 'admin']),
  temporaryPassword: z
    .string()
    .min(12, '임시 비밀번호는 최소 12자 이상이어야 합니다')
    .regex(/[A-Z]/, '대문자를 포함해야 합니다')
    .regex(/[a-z]/, '소문자를 포함해야 합니다')
    .regex(/[0-9]/, '숫자를 포함해야 합니다')
    .regex(/[^A-Za-z0-9]/, '특수문자를 포함해야 합니다'),
});

// 관리자 - 템플릿 생성 검증
export const templateCreateSchema = z.object({
  year: z.number().int().min(2024).max(2030),
  title: z.string().min(1, '제목을 입력하세요').max(100),
  description: z.string().max(500).optional(),
});

// CSV 행 검증 (템플릿 업로드용)
export const csvRowSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, '올바른 날짜 형식이 아닙니다'),
  day_number: z.number().int().min(1).max(366),
  passages: z.string().min(1, '성경 구절을 입력하세요'),
  notes: z.string().optional(),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type DevotionPlanInput = z.infer<typeof devotionPlanSchema>;
export type CheckinInput = z.infer<typeof checkinSchema>;
export type ReadingPlanCreateInput = z.infer<typeof readingPlanCreateSchema>;
export type ReadingCompletionInput = z.infer<typeof readingCompletionSchema>;
export type ProvisionAccountInput = z.infer<typeof provisionAccountSchema>;
export type TemplateCreateInput = z.infer<typeof templateCreateSchema>;
export type CSVRowInput = z.infer<typeof csvRowSchema>;
