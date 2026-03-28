/**
 * 관리자 계정 초기 생성 스크립트
 * 실행: npx ts-node scripts/seed-admins.ts
 * 또는 Supabase 대시보드 > Authentication에서 직접 생성
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('환경변수 NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY를 설정하세요.');
  process.exit(1);
}

const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const admins = [
  { email: 'admin@admin.com', fullName: '관리자', password: '1111' },
  { email: 'nhyunwoo@empas.com', fullName: '남궁현우', password: '1111' },
];

async function seedAdmins() {
  for (const admin of admins) {
    console.log(`계정 생성 중: ${admin.email}`);

    // Auth 계정 생성
    const { data: userData, error: createError } = await adminClient.auth.admin.createUser({
      email: admin.email,
      password: admin.password,
      email_confirm: true,
      user_metadata: { full_name: admin.fullName },
    });

    if (createError) {
      console.error(`  실패: ${createError.message}`);
      continue;
    }

    const userId = userData.user?.id;
    if (!userId) {
      console.error('  실패: 사용자 ID 없음');
      continue;
    }

    // user_profiles 역할을 admin으로 업데이트
    // (트리거가 'user'로 생성하므로 admin으로 변경)
    const { error: updateError } = await adminClient
      .from('user_profiles')
      .update({ role: 'admin' })
      .eq('id', userId);

    if (updateError) {
      console.error(`  프로필 업데이트 실패: ${updateError.message}`);
    } else {
      console.log(`  완료: ${admin.fullName} (${admin.email})`);
    }
  }

  console.log('\n시드 완료!');
}

seedAdmins().catch(console.error);
