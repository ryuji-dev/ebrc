/**
 * 비밀번호 초기화 스크립트 (서비스 롤 키 사용, 메일 발송 없음)
 *
 * 실행:
 *   npx dotenv -e .env.local -- \
 *     env TS_NODE_COMPILER_OPTIONS='{"module":"commonjs","moduleResolution":"node"}' \
 *     npx ts-node scripts/reset-password.ts <email> <new-password>
 *
 * 예시:
 *   npx dotenv -e .env.local -- env TS_NODE_COMPILER_OPTIONS='{"module":"commonjs","moduleResolution":"node"}' npx ts-node scripts/reset-password.ts hiryuji@kakao.com 새비밀번호
 *
 * 주의: 서비스 롤 키를 사용하므로 로컬에서만 실행하고, 비밀번호는 셸 히스토리에 남지 않도록 주의하세요.
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const MIN_PASSWORD_LENGTH = 6; // lib/utils/validation.ts 의 정책과 동일

function printUsage() {
  console.error('사용법: ts-node scripts/reset-password.ts <email> <new-password>');
}

async function resetPassword(email: string, newPassword: string) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('환경변수 NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY를 설정하세요.');
    process.exit(1);
  }

  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // 이메일로 사용자 검색 (auth.admin에는 이메일 단건 조회가 없어 목록에서 찾음)
  let userId: string | undefined;
  let page = 1;
  const perPage = 1000;

  while (!userId) {
    const { data, error } = await adminClient.auth.admin.listUsers({ page, perPage });
    if (error) {
      console.error(`사용자 조회 실패: ${error.message}`);
      process.exit(1);
    }

    const found = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (found) {
      userId = found.id;
      break;
    }

    if (data.users.length < perPage) break;
    page += 1;
  }

  if (!userId) {
    console.error(`사용자를 찾을 수 없습니다: ${email}`);
    process.exit(1);
  }

  const { error: updateError } = await adminClient.auth.admin.updateUserById(userId, {
    password: newPassword,
  });

  if (updateError) {
    console.error(`비밀번호 변경 실패: ${updateError.message}`);
    process.exit(1);
  }

  // 역할 확인 (관리자 계정인지 참고용 출력)
  const { data: profile } = await adminClient
    .from('user_profiles')
    .select('full_name, role')
    .eq('id', userId)
    .maybeSingle();

  console.log(`비밀번호가 변경되었습니다: ${email}`);
  if (profile) {
    console.log(`  이름: ${profile.full_name ?? '-'} / 역할: ${profile.role}`);
  }
}

const [, , email, newPassword] = process.argv;

if (!email || !newPassword) {
  printUsage();
  process.exit(1);
}

if (!email.includes('@')) {
  console.error('올바른 이메일 형식이 아닙니다.');
  process.exit(1);
}

if (newPassword.length < MIN_PASSWORD_LENGTH) {
  console.error(`비밀번호는 ${MIN_PASSWORD_LENGTH}자 이상이어야 합니다.`);
  process.exit(1);
}

resetPassword(email, newPassword).catch((err) => {
  console.error(err);
  process.exit(1);
});
