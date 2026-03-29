-- ============================================================
-- EBRC (Chongshin University Bible Reading Club) DB Migration
-- Supabase SQL Editor에 전체 내용을 붙여넣고 실행하세요.
-- ============================================================

-- ============================================================
-- 1. ENUMS
-- ============================================================

CREATE TYPE user_role AS ENUM ('user', 'admin');
CREATE TYPE devotion_plan_frequency AS ENUM ('daily', 'weekly', 'monthly');
CREATE TYPE reading_plan_status AS ENUM ('not_started', 'in_progress', 'completed', 'abandoned');


-- ============================================================
-- 2. TABLES
-- ============================================================

-- 사용자 프로필
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'user',
  cumulative_readthrough_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 경건생활 계획
CREATE TABLE devotion_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  frequency devotion_plan_frequency NOT NULL,
  target_count INTEGER NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 경건생활 체크인 (parent_id: 자정 걸침 세션 처리용)
CREATE TABLE devotion_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID REFERENCES devotion_plans(id) ON DELETE SET NULL,
  parent_id UUID REFERENCES devotion_checkins(id) ON DELETE CASCADE,
  checkin_date DATE NOT NULL,
  duration_minutes INTEGER,
  memo TEXT,
  planned_start_time TEXT,
  start_time TEXT,
  end_time TEXT,
  planned_end_time TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES auth.users(id),
  updated_by UUID NOT NULL REFERENCES auth.users(id)
);

-- 성경읽기 계획 템플릿 (관리자 생성)
CREATE TABLE reading_plan_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 성경읽기 계획 템플릿 항목 (일별 읽기 분량)
CREATE TABLE reading_plan_template_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES reading_plan_templates(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  day_number INTEGER NOT NULL,
  passages TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 사용자 성경읽기 계획 등록
CREATE TABLE user_reading_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES reading_plan_templates(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  status reading_plan_status NOT NULL DEFAULT 'not_started',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 사용자 성경읽기 완료 기록
CREATE TABLE user_reading_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES user_reading_plans(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  memo TEXT
);

-- 성경 챕터 읽기 진행 현황 (soft-delete 패턴)
CREATE TABLE user_bible_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id INTEGER NOT NULL,
  chapter INTEGER NOT NULL,
  year INTEGER NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  UNIQUE(user_id, book_id, chapter, year)
);


-- 성경읽기 계획 (관리자 생성)
CREATE TABLE reading_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  created_by UUID REFERENCES auth.users(id),
  book_ids INTEGER[] NOT NULL DEFAULT '{}',
  total_chapters INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 성경읽기 계획 참가자
CREATE TABLE reading_plan_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES reading_plans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  UNIQUE(plan_id, user_id)
);

-- 성경읽기 계획 진행 현황 (soft-delete 패턴)
CREATE TABLE reading_plan_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES reading_plans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  book_id INTEGER NOT NULL,
  chapter INTEGER NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at TIMESTAMPTZ,
  UNIQUE(plan_id, user_id, book_id, chapter)
);


-- ============================================================
-- 3. INDEXES
-- ============================================================

CREATE INDEX idx_devotion_checkins_user_id ON devotion_checkins(user_id);
CREATE INDEX idx_devotion_checkins_checkin_date ON devotion_checkins(checkin_date);
CREATE INDEX idx_user_reading_plans_user_id ON user_reading_plans(user_id);
CREATE INDEX idx_user_reading_completions_user_id ON user_reading_completions(user_id);
CREATE INDEX idx_user_reading_completions_plan_date ON user_reading_completions(plan_id, date);
CREATE INDEX idx_user_bible_progress_user_year ON user_bible_progress(user_id, year);
CREATE INDEX idx_reading_plans_created_by ON reading_plans(created_by);
CREATE INDEX idx_reading_plan_participants_plan_id ON reading_plan_participants(plan_id);
CREATE INDEX idx_reading_plan_participants_user_id ON reading_plan_participants(user_id);
CREATE INDEX idx_reading_plan_progress_plan_user ON reading_plan_progress(plan_id, user_id);


-- ============================================================
-- 4. DATABASE FUNCTIONS
-- ============================================================

-- 현재 사용자가 admin인지 확인
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 신규 회원 가입 시 user_profiles 자동 생성 트리거
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.email, ''),
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'user'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 읽기 완료 확인 후 계획 자동 완료 처리
CREATE OR REPLACE FUNCTION check_and_complete_reading_plan(p_plan_id UUID)
RETURNS TABLE(
  is_newly_completed BOOLEAN,
  total_items INTEGER,
  completed_items INTEGER,
  completion_percentage NUMERIC
) AS $$
DECLARE
  v_total INTEGER;
  v_completed INTEGER;
  v_template_id UUID;
BEGIN
  -- 템플릿의 전체 항목 수
  SELECT urp.template_id INTO v_template_id
  FROM user_reading_plans urp
  WHERE urp.id = p_plan_id;

  SELECT COUNT(*) INTO v_total
  FROM reading_plan_template_items
  WHERE template_id = v_template_id;

  -- 완료된 항목 수
  SELECT COUNT(*) INTO v_completed
  FROM user_reading_completions
  WHERE plan_id = p_plan_id;

  -- 100% 완료 시 계획 상태 업데이트
  IF v_total > 0 AND v_completed >= v_total THEN
    UPDATE user_reading_plans
    SET status = 'completed', completed_at = now(), updated_at = now()
    WHERE id = p_plan_id AND status != 'completed';

    RETURN QUERY SELECT
      TRUE::BOOLEAN,
      v_total,
      v_completed,
      100.0::NUMERIC;
  ELSE
    RETURN QUERY SELECT
      FALSE::BOOLEAN,
      v_total,
      v_completed,
      CASE WHEN v_total > 0 THEN ROUND((v_completed::NUMERIC / v_total) * 100, 1) ELSE 0 END;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================
-- 5. ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE devotion_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE devotion_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_plan_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_plan_template_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_reading_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_reading_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_bible_progress ENABLE ROW LEVEL SECURITY;

-- user_profiles
CREATE POLICY "본인 프로필 조회" ON user_profiles FOR SELECT
  USING (auth.uid() = id OR is_admin());

CREATE POLICY "본인 프로필 수정" ON user_profiles FOR UPDATE
  USING (auth.uid() = id);

-- devotion_plans
CREATE POLICY "본인 경건계획 CRUD" ON devotion_plans FOR ALL
  USING (auth.uid() = user_id);

-- devotion_checkins
CREATE POLICY "본인 체크인 조회 또는 관리자" ON devotion_checkins FOR SELECT
  USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "본인 체크인 추가" ON devotion_checkins FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "본인 체크인 수정" ON devotion_checkins FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "본인 체크인 삭제" ON devotion_checkins FOR DELETE
  USING (auth.uid() = user_id);

-- reading_plan_templates (모든 인증 사용자 읽기, 관리자만 쓰기)
CREATE POLICY "템플릿 전체 조회" ON reading_plan_templates FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "관리자만 템플릿 생성" ON reading_plan_templates FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "관리자만 템플릿 수정" ON reading_plan_templates FOR UPDATE
  USING (is_admin());

-- reading_plan_template_items
CREATE POLICY "템플릿 항목 전체 조회" ON reading_plan_template_items FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "관리자만 항목 생성" ON reading_plan_template_items FOR INSERT
  WITH CHECK (is_admin());

-- user_reading_plans
CREATE POLICY "본인 읽기계획 CRUD" ON user_reading_plans FOR ALL
  USING (auth.uid() = user_id);

-- user_reading_completions
CREATE POLICY "본인 완료기록 조회/추가" ON user_reading_completions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "본인 완료기록 추가" ON user_reading_completions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "본인 완료기록 삭제" ON user_reading_completions FOR DELETE
  USING (auth.uid() = user_id);

-- user_bible_progress
CREATE POLICY "본인 성경진행 CRUD" ON user_bible_progress FOR ALL
  USING (auth.uid() = user_id);

-- reading_plans
ALTER TABLE reading_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "활성 계획 전체 조회" ON reading_plans FOR SELECT
  USING (is_active = true);
CREATE POLICY "관리자 계획 관리" ON reading_plans FOR ALL
  USING (is_admin());

-- reading_plan_participants
ALTER TABLE reading_plan_participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "참가자 전체 조회" ON reading_plan_participants FOR SELECT
  USING (true);
CREATE POLICY "본인 참가 관리" ON reading_plan_participants FOR ALL
  USING (auth.uid() = user_id);

-- reading_plan_progress
ALTER TABLE reading_plan_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "진행현황 전체 조회" ON reading_plan_progress FOR SELECT
  USING (true);
CREATE POLICY "본인 진행 관리" ON reading_plan_progress FOR ALL
  USING (auth.uid() = user_id);


-- ============================================================
-- 6. PERMISSIONS (GRANTS)
-- ============================================================

-- service_role 권한 부여 (Admin API 대응)
GRANT ALL ON TABLE user_profiles TO service_role;
GRANT ALL ON TABLE reading_plans TO service_role;
GRANT ALL ON TABLE reading_plan_participants TO service_role;
GRANT ALL ON TABLE reading_plan_progress TO service_role;

-- authenticated 사용자 권한 부여
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE user_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE reading_plans TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE reading_plan_participants TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE reading_plan_progress TO authenticated;

-- 시퀀스 권한 부여
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;
