# RUboard 작업 인계 문서

## 현재 상태 요약

**날짜**: 2024-12-23

### 완료된 작업

#### 1. 데이터베이스 스키마 간소화 ✅
- 기존 15+ 테이블 → **10개 테이블**로 간소화
- Supabase에 새 스키마 적용 완료
- SQL 파일: `supabase/migrations/100_simplified_schema.sql`

#### 2. 문서 작성 완료 ✅
| 파일 | 내용 |
|------|------|
| `CLAUDE.md` | 프로젝트 개발 가이드 |
| `docs/01_PRD.md` | Product Requirements Document |
| `docs/02_DATABASE_SCHEMA.md` | 데이터베이스 스키마 상세 |
| `docs/03_DATA_FLOW.md` | 발주 워크플로우, 데이터 흐름 |
| `docs/04_FEATURE_SPEC.md` | 기능 명세서, UI 와이어프레임 |
| `docs/05_IMPLEMENTATION.md` | 구현 Spec, API 목록 |

#### 3. 타입 정의 수정 ✅
- 파일: `src/types/index.ts`
- 6개 OrderStatus로 간소화

#### 4. 일부 코드 수정 ✅
- `src/app/page.tsx` - 대시보드
- `src/app/products/page.tsx` - 제품 목록
- `src/app/orders/page.tsx` - 발주 목록
- `src/components/products/ProductsTable.tsx`
- `src/components/products/ExcelImporter.tsx`
- `src/components/orders/OrdersTable.tsx`
- `src/app/api/products/import/route.ts`

---

## 남은 작업

### 1. 문서 검토 및 확정 (현재 진행 중)
- 사용자 검토 후 수정 반영

### 2. 코드 수정 (대기 중)

#### 발주 관련 페이지
- [ ] `src/app/orders/new/page.tsx` - 발주 생성 폼
- [ ] `src/app/orders/[id]/page.tsx` - 발주 상세
- [ ] `src/components/orders/OrderForm.tsx` - 발주 폼 컴포넌트
- [ ] `src/components/orders/ProductSelector.tsx` - 제품 선택 모달

#### API 라우트
- [ ] `src/app/api/orders/route.ts` - 발주 CRUD
- [ ] `src/app/api/orders/[id]/route.ts` - 발주 상세/수정

#### 추가 페이지
- [ ] `src/app/inventory/page.tsx` - 재고 현황 (조회 전용)
- [ ] `src/app/production/page.tsx` - 생산 일정 (조회 전용)

---

## 핵심 정보

### 데이터베이스 테이블 (10개)
| 테이블 | 설명 |
|--------|------|
| ru_users | 사용자 |
| ru_products | 제품 마스터 |
| ru_prices | 가격 (base/commission/final) |
| ru_inventory | 재고 (ERP 연동, 읽기 전용) |
| ru_production | 생산 일정 (조회 전용) |
| ru_orders | 발주서 헤더 |
| ru_order_items | 발주 품목 |
| ru_packing_lists | 패킹리스트 |
| ru_packing_items | 패킹 상세 |
| ru_invoices | 인보이스 상세 |

### 발주 상태 (6개)
```
DRAFT → CONFIRMED → PACKING → SHIPPED → COMPLETED
  │         │
  └─────────┴──────→ CANCELLED
```

### PRD 핵심 기능 범위
- ✅ 제품 마스터 + 엑셀 임포트
- ✅ 발주 관리 (핵심)
- ✅ 패킹리스트/인보이스 생성
- ⚠️ 재고: ERP 연동 (읽기 전용)
- ⚠️ 생산일정: 조회용

### Supabase 연결 정보
- URL: `https://usvjbuudnofwhmclwhfl.supabase.co`
- MCP 설정: `.claude/mcp.json`

---

## 즉시 실행 가능한 명령어

```bash
# 개발 서버 실행
npm run dev

# 타입 체크
npx tsc --noEmit
```

---

## 참고 파일

- 기존 엑셀 발주서: `26년2월 카자흐스탄행 확정발주.xlsx`
- 환경변수: `.env.local`
