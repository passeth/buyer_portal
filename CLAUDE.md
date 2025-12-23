# RUboard - 러시아 발주 관리 플랫폼

## 프로젝트 개요

러시아/카자흐스탄 바이어를 위한 B2B 화장품 발주 관리 시스템

### 비즈니스 구조

```
러시아/카자흐스탄 바이어 (buyer)
        ↓ 발주
인덜톤 (manager) - 중개업체
        ↓ 재고 확인/조율
에바스코스메틱 (supplier) - 공급사
        ↓ 패킹/출고
바이어 배송
```

---

## 기술 스택

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: Supabase (PostgreSQL)
- **UI**: shadcn/ui + Tailwind CSS
- **PDF**: @react-pdf/renderer

---

## 디렉토리 구조

```
@ongoing_RUboard/
├── CLAUDE.md                    # 이 파일
├── docs/
│   ├── 01_PRD.md               # Product Requirements Document
│   ├── 02_DATABASE_SCHEMA.md   # 데이터베이스 스키마
│   ├── 03_DATA_FLOW.md         # 데이터 흐름 정의
│   ├── 04_FEATURE_SPEC.md      # 기능 명세서
│   └── 05_IMPLEMENTATION.md    # 구현 Spec
├── supabase/
│   └── migrations/
│       └── 100_simplified_schema.sql
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── page.tsx           # 대시보드
│   │   ├── products/          # 제품 관리
│   │   ├── orders/            # 발주 관리
│   │   └── api/               # API Routes
│   ├── components/
│   │   ├── ui/                # shadcn/ui 컴포넌트
│   │   ├── products/          # 제품 관련 컴포넌트
│   │   └── orders/            # 발주 관련 컴포넌트
│   ├── lib/
│   │   └── supabase/          # Supabase 클라이언트
│   ├── types/
│   │   └── index.ts           # TypeScript 타입 정의
│   └── hooks/                 # Custom Hooks
└── public/
```

---

## 데이터베이스 (Supabase)

### 테이블 구조 (10개)

| 그룹 | 테이블 | 설명 |
|------|--------|------|
| 마스터 | ru_users | 사용자 (buyer/manager/supplier/admin) |
| 마스터 | ru_products | 제품 마스터 |
| 마스터 | ru_prices | 가격 (base_price, commission, final_price) |
| 마스터 | ru_inventory | 재고 현황 (ERP 연동, 읽기 전용) |
| 마스터 | ru_production | 생산 일정 (조회용) |
| 거래 | ru_orders | 발주서 헤더 |
| 거래 | ru_order_items | 발주 품목 |
| 거래 | ru_packing_lists | 패킹리스트 헤더 |
| 거래 | ru_packing_items | 패킹 상세 |
| 거래 | ru_invoices | 인보이스 상세 |

### 발주 상태 (6개)

```
DRAFT → CONFIRMED → PACKING → SHIPPED → COMPLETED
  │         │
  └─────────┴──────→ CANCELLED
```

### 발주번호 형식

```
{지역코드}-{년도}-{시퀀스 4자리}
예: KZ-2026-0001, RU-2026-0015
```

---

## 개발 명령어

```bash
# 개발 서버 실행
npm run dev

# 빌드
npm run build

# 타입 체크
npx tsc --noEmit

# 린트
npm run lint
```

---

## 환경 변수 (.env.local)

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx
```

---

## 핵심 기능

### 1. 제품 관리
- 제품 목록/상세 조회
- 엑셀 일괄 임포트 (품목코드, 품목명, 바코드, 입수량, 단가)
- 가격 관리 (본사가, 커미션, 최종가)

### 2. 발주 관리 (핵심)
- 발주 생성 (DRAFT)
- 수량 조정 및 확정 (CONFIRMED)
- 패킹 진행 (PACKING)
- 출고 완료 (SHIPPED → COMPLETED)

### 3. 문서 생성
- 패킹리스트 PDF
- 인보이스 PDF

### 4. 재고/생산 (보조)
- 재고 현황 조회 (ERP 연동)
- 생산 일정 조회

---

## 역할별 권한

| 역할 | 제품 | 발주 생성 | 발주 확정 | 패킹 | 재고 |
|------|------|----------|----------|------|------|
| buyer | 조회 | ✓ | - | - | - |
| manager | 조회 | - | ✓ | - | 조회 |
| supplier | 수정 | - | - | ✓ | 수정 |
| admin | 전체 | ✓ | ✓ | ✓ | 수정 |

---

## 코딩 컨벤션

### 파일명
- 컴포넌트: PascalCase (예: `OrdersTable.tsx`)
- 유틸리티: camelCase (예: `formatCurrency.ts`)
- 타입 정의: `index.ts` 또는 `types.ts`

### 컴포넌트
- 서버 컴포넌트 기본 사용
- 클라이언트 필요시 `'use client'` 선언
- props 인터페이스 명시

### 데이터베이스
- 테이블명: `ru_` 접두사 + snake_case
- 컬럼명: snake_case
- product_code가 비즈니스 키

---

## 문서 참조

상세한 내용은 `docs/` 폴더의 문서를 참조하세요:

- [01_PRD.md](docs/01_PRD.md) - 제품 요구사항
- [02_DATABASE_SCHEMA.md](docs/02_DATABASE_SCHEMA.md) - DB 스키마
- [03_DATA_FLOW.md](docs/03_DATA_FLOW.md) - 데이터 흐름
- [04_FEATURE_SPEC.md](docs/04_FEATURE_SPEC.md) - 기능 명세
- [05_IMPLEMENTATION.md](docs/05_IMPLEMENTATION.md) - 구현 Spec
