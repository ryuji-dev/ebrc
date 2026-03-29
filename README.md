# 📖 EBRC (에스라성경통독사경회)

[![Next.js](https://img.shields.io/badge/Next.js-15-000000?style=for-the-badge&logo=nextdotjs)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react)](https://reactjs.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)

**EBRC**는 하나님의 말씀을 가까이하고 경건의 생활을 기록하며 성경 통독의 기쁨을 나누기 위해 만들어진 성경 통독 및 경건 생활 관리 플랫폼입니다. 총신대학교 에스라성경통독사경회의 철학을 담아, 누구나 꾸준하고 체계적으로 성경을 읽고 기록할 수 있도록 돕습니다.

---

## ✨ Key Features

### 🚀 대시보드 (Personal Dashboard)
- **맞춤형 위젯**: 오늘 경건시간, 월간 활동, 현재 참여 중인 통독 플랜 진행률 등을 한눈에 확인.
- **자유로운 커스터마이징**: 위젯의 노출 여부와 순서를 사용자의 취향에 맞게 설정.
- **실시간 통계**: 연간 성경 통독 진행률과 누적 완독 횟수를 실시간으로 계산하여 반영.

### 📖 성경 통독표 (Bible Reading Progress)
- **압도적인 퍼포먼스**: 66권, 1189장의 방대한 데이터를 Optimistic Update와 Memoization 기술로 끊김 없이 관리.
- **유연한 기록**: 특정 날짜의 읽기 완료/취소는 물론, 과거의 완독 기록까지 직접 입력 가능.
- **시각적 성취감**: 구약(Indigo)과 신약(Rose)을 구분한 유려한 디자인과 진행률 게이지 제공.

### ✍️ 경건의 기록 (Devotion Logs)
- **Daily Check-in**: 매일의 경건 시간을 기록하고 꾸준함을 유지.
- **참여 플랜 관리**: 다양한 성경 읽기 플랜에 참여하고 자신의 진행 상태를 추적.

---

## 🛠 Tech Stack

- **Framework**: `Next.js 15 (App Router)`
- **Library**: `React 19`
- **Database / Auth**: `Supabase` (PostgreSQL, Row Level Security)
- **UI Components**: `Radix UI`, `Lucide React`
- **Styling**: `Tailwind CSS` (Glassmorphism & Dark Mode)
- **Form / Validation**: `Zod`
- **Deployment**: `Cloudflare Pages` (Planned)

---

## ⚡ Performance Optimization

- **Parallel Data Fetching**: 서버 컴포넌트의 데이터 요청 워터폴(Waterfall)을 제거하여 초기 로딩 속도 극대화.
- **Optimistic Updates**: 데이터베이스 반영 전 사용자 인터페이스를 즉시 업데이트하여 "Zero Latency" 경험 제공.
- **Component Memoization**: 대규모 리스트(성경 66권) 렌더링 시 불필요한 재렌더링을 차단하여 저사양 기기에서도 부드러운 동작 보장.

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- Supabase 프로젝트 및 API Key

### Installation

```bash
# Repository 클론
git clone https://github.com/your-repo/ebrc.git
cd ebrc

# 의존성 설치
npm install

# 환경 변수 설정
# .env.local 파일 생성 후 다음 항목 입력
# NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
# SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# 개발 서버 실행
npm run dev
```

---

## 🎨 Design Philosophy

EBRC는 **"Deep Focus"**와 **"Premium Aesthetics"**를 지향합니다.
- 복잡함을 덜어내고 본질(말씀)에 집중할 수 있는 **Dark Theme** 기반의 인터페이스.
- 유리 질감(**Glassmorphism**)과 부드러운 그라데이션을 사용한 현대적이고 고급스러운 디자인.
- 사용자 인터랙션에 반응하는 세밀한 **Micro-animations**.

---

## 📜 License

Copyright © 2026 EBRC. All rights reserved.
MIT License 에 근거하여 배포됩니다.
