# RUboard - 발주 시스템 워크플로우

> **최종 업데이트**: 2025-12-23
> **스키마 참조**: `supabase/migrations/200_final_table_info.sql`

---

## 1. 발주 상태 흐름

### 1.1 상태 전이 다이어그램

```
                  ┌─────────────────────────────────────────────────────────┐
                  │                                                         │
                  ▼                                                         │
    ┌──────────────────┐                                                    │
    │      DRAFT       │ ◄── 발주 생성 (바이어)                              │
    │   (발주 작성 중)  │                                                    │
    └────────┬─────────┘                                                    │
             │                                                              │
             │ 제출/확정                                                      │
             ▼                                                              │
    ┌──────────────────┐                                                    │
    │    CONFIRMED     │ ◄── 확정 (매니저)                                   │
    │     (확정됨)      │                                                    │
    └────────┬─────────┘                                                    │
             │                                                              │
             │ 패킹 시작                                                      │
             ▼                                                              │
    ┌──────────────────┐                                                    │
    │     PACKING      │ ◄── 패킹 (공급사)                                   │
    │  (패킹 진행 중)   │                                                    │
    └────────┬─────────┘                                                    │
             │                                                              │
             │ 출고                                                          │
             ▼                                                              │
    ┌──────────────────┐                                                    │
    │     SHIPPED      │ ◄── 출고 완료                                       │
    │   (출고 완료)     │                                                    │
    └────────┬─────────┘                                                    │
             │                                                              │
             │ 완료                                                          │
             ▼                                                              │
    ┌──────────────────┐                                                    │
    │    COMPLETED     │ ◄── 거래 종료                                       │
    │   (거래 종료)     │                                                    │
    └──────────────────┘                                                    │
                                                                            │
    ┌──────────────────┐                                                    │
    │    CANCELLED     │ ◄──────────────────────────────────────────────────┘
    │     (취소됨)      │     DRAFT, CONFIRMED 상태에서 취소 가능
    └──────────────────┘
```

### 1.2 상태별 권한

| 상태 | 바이어 | 매니저 | 공급사 | 설명 |
|------|--------|--------|--------|------|
| DRAFT | 수정/삭제 | 조회 | - | 바이어가 발주서 작성 |
| CONFIRMED | 조회 | 수정 | 조회 | 매니저가 수량 조정 가능 |
| PACKING | 조회 | 조회 | 수정 | 공급사가 패킹 진행 |
| SHIPPED | 조회 | 조회 | 조회 | 변경 불가 |
| COMPLETED | 조회 | 조회 | 조회 | 변경 불가 |
| CANCELLED | 조회 | 조회 | 조회 | 변경 불가 |

---

## 2. 발주 생성 워크플로우

### 2.1 Step 1: 발주 생성 (DRAFT)

**실행 주체**: 바이어

**UI 흐름**:
```
[제품 목록 페이지]
    │
    ├── 제품 선택 (체크박스)
    ├── 수량 입력
    ├── 목적지 선택
    │
    └── [발주 추가] 버튼
            │
            ▼
[발주서 작성 페이지]
    │
    ├── 발주 품목 목록 (추가/수정/삭제)
    ├── 발주 요약 (총 수량, 총 금액)
    │
    └── [저장] / [제출] 버튼
```

**데이터 생성**:

```sql
-- ru_orders (1건)
INSERT INTO ru_orders (
  id,                    -- 'RU-2025-01' (월별 ID)
  order_number,          -- 'RU-2025-01' (동일)
  buyer_id,              -- 로그인 사용자 UUID
  buyer_name,            -- '카자흐 바이어' (스냅샷)
  order_date,            -- CURRENT_DATE
  destination,           -- '블라디보스톡'
  status,                -- 'DRAFT'
  history                -- '[{"date":"...","action":"created","by":"buyer@kz.com"}]'
) VALUES (...);

-- ru_order_items (N건)
INSERT INTO ru_order_items (
  order_id,              -- 'RU-2025-01'
  product_code,          -- 'PDSP009'
  product_name,          -- '페디슨 샴푸 500ml' (스냅샷)
  destination,           -- '블라디보스톡' (품목별 목적지)
  pcs_per_ctn,           -- 24 (입수량)
  requested_qty,         -- 120
  supply_price,          -- 3000 (본사가 스냅샷)
  commission,            -- 500 (커미션 스냅샷)
  unit_price,            -- 3500 (최종가)
  supply_total,          -- 360000 (3000 × 120)
  commission_total,      -- 60000 (500 × 120)
  subtotal               -- 420000 (3500 × 120)
) VALUES (...);
```

**가격 스냅샷 로직**:
```sql
-- ru_prices에서 현재 유효한 가격 조회
SELECT supply_price, commission, final_price
FROM ru_prices
WHERE product_code = 'PDSP009'
  AND effective_date <= CURRENT_DATE
ORDER BY effective_date DESC
LIMIT 1;
```

### 2.2 Step 2: 발주 확정 (CONFIRMED)

**실행 주체**: 매니저

**가능한 작업**:
- 수량 조정 (requested_qty → confirmed_qty)
- 품목 삭제
- 비고 추가

**데이터 수정**:
```sql
-- ru_orders 상태 변경
UPDATE ru_orders SET
  status = 'CONFIRMED',
  history = history || '[{"date":"...","action":"confirmed","by":"manager@..."}]'::jsonb
WHERE id = 'RU-2025-01';

-- ru_order_items 수량 확정 (조정된 경우)
UPDATE ru_order_items SET
  confirmed_qty = 100,  -- 120 → 100 조정
  supply_total = 100 * supply_price,
  commission_total = 100 * commission,
  subtotal = 100 * unit_price
WHERE order_id = 'RU-2025-01' AND product_code = 'PDSP009';
```

**이력 기록**:
```json
{
  "date": "2025-01-15T10:30:00Z",
  "action": "qty_adjusted",
  "by": "manager@inderton.com",
  "changes": "PDSP009: 120→100"
}
```

### 2.3 Step 3: 패킹 (PACKING)

**실행 주체**: 공급사

**데이터 생성**:
```sql
-- ru_orders 상태 변경
UPDATE ru_orders SET status = 'PACKING' WHERE id = 'RU-2025-01';

-- ru_packing_lists (1건)
INSERT INTO ru_packing_lists (
  pl_number,             -- 'PL-20250127-OV5' (PK)
  order_id,              -- 'RU-2025-01'
  invoice_number,        -- 'EC25R-0001-OV5'
  invoice_date,          -- '2025-01-27'
  exporter_name,         -- 'EVAS COSMETIC CO., LTD.'
  consignee_name,        -- 'OOO VLADIVOSTOK TRADE'
  destination,           -- '블라디보스톡'
  total_qty,             -- 자동 계산
  total_cartons,         -- 자동 계산
  total_cbm              -- 자동 계산
) VALUES (...);

-- ru_packing_items (N건)
INSERT INTO ru_packing_items (
  packing_list_id,       -- 'PL-20250127-OV5'
  product_code,          -- 'PDSP009'
  product_name,          -- '페디슨 샴푸 500ml'
  qty,                   -- 100
  cartons,               -- 5 (100 ÷ 24 = 4.17 → 5박스)
  nw_kg,                 -- 50.0
  gw_kg,                 -- 55.0
  cbm,                   -- 0.125
  pallet_number          -- 1
) VALUES (...);
```

### 2.4 Step 4-5: 출고 및 완료

```sql
-- SHIPPED
UPDATE ru_orders SET
  status = 'SHIPPED',
  history = history || '[{"date":"...","action":"shipped","by":"supplier@..."}]'::jsonb
WHERE id = 'RU-2025-01';

-- COMPLETED
UPDATE ru_orders SET
  status = 'COMPLETED',
  completed_at = NOW(),
  history = history || '[{"date":"...","action":"completed","by":"..."}]'::jsonb
WHERE id = 'RU-2025-01';
```

---

## 3. 데이터 관계도

### 3.1 테이블 관계

```
ru_users
    │
    │ buyer_id (UUID)
    ▼
ru_orders ─────────────────────────────────────────┐
    │ id: VARCHAR(20) = 'RU-2025-01'              │
    │ order_number: VARCHAR(20) = 'RU-2025-01'    │
    │                                              │
    │ order_id (VARCHAR 20)                        │
    ├──────────────────────────────────────────────┤
    │                                              │
    ▼                                              ▼
ru_order_items                              ru_packing_lists
    │                                              │ pl_number: VARCHAR(30)
    │ product_code                                 │ = 'PL-20250127-OV5'
    │                                              │
    ▼                                              │ packing_list_id
ru_products ◄──── ru_prices                        │
                                                   ▼
                                            ru_packing_items
```

### 3.2 발주 ID 체계

| 필드 | 형식 | 예시 | 설명 |
|------|------|------|------|
| ru_orders.id | `{지역}-{년도}-{월}` | RU-2025-01 | PK, 월별 |
| ru_orders.order_number | 동일 | RU-2025-01 | UK |
| ru_packing_lists.pl_number | `PL-{날짜}-{이름}` | PL-20250127-OV5 | PK |

---

## 4. 가격 구조

### 4.1 3단계 가격

```
┌─────────────────────────────────────────────────────────────────┐
│                      ru_prices                                   │
│                                                                  │
│  ┌───────────────┐   ┌───────────────┐   ┌───────────────┐     │
│  │ supply_price  │ + │  commission   │ = │  final_price  │     │
│  │  (본사가)      │   │  (커미션)      │   │  (최종가)      │     │
│  │  에바스 →      │   │  인덜톤 마진   │   │  바이어 결제   │     │
│  └───────────────┘   └───────────────┘   └───────────────┘     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼ 발주 시 스냅샷
┌─────────────────────────────────────────────────────────────────┐
│                    ru_order_items                                │
│                                                                  │
│  supply_price    → supply_total   (본사가 × 수량)                 │
│  commission      → commission_total (커미션 × 수량)               │
│  unit_price      → subtotal       (최종가 × 수량)                 │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 역할별 가격 접근

| 필드 | 바이어 | 매니저 | 공급사 |
|------|--------|--------|--------|
| supply_price / supply_total | ❌ | ✓ | ✓ |
| commission / commission_total | ❌ | ✓ | ❌ |
| unit_price / subtotal (final) | ✓ | ✓ | ✓ |

---

## 5. 발주 합계 자동 계산

### 5.1 트리거 동작

```sql
-- tr_ru_order_items_totals 트리거
-- INSERT/UPDATE/DELETE 시 자동 실행

UPDATE ru_orders SET
  total_qty = (
    SELECT COALESCE(SUM(COALESCE(confirmed_qty, requested_qty)), 0)
    FROM ru_order_items
    WHERE order_id = 'RU-2025-01'
  ),
  total_amount = (
    SELECT COALESCE(SUM(subtotal), 0)
    FROM ru_order_items
    WHERE order_id = 'RU-2025-01'
  )
WHERE id = 'RU-2025-01';
```

### 5.2 계산 우선순위

```
수량: confirmed_qty가 있으면 사용, 없으면 requested_qty
금액: subtotal (= unit_price × 수량)
```

---

## 6. 이력 관리 (JSONB)

### 6.1 history 필드 구조

```json
[
  {
    "date": "2025-01-10T09:00:00Z",
    "action": "created",
    "by": "buyer@kz.com",
    "changes": null
  },
  {
    "date": "2025-01-13T10:00:00Z",
    "action": "qty_adjusted",
    "by": "manager@inderton.com",
    "changes": "PDSP009: 120→100, VMSM001: 50→48"
  },
  {
    "date": "2025-01-13T10:05:00Z",
    "action": "confirmed",
    "by": "manager@inderton.com",
    "changes": null
  },
  {
    "date": "2025-01-25T09:00:00Z",
    "action": "shipped",
    "by": "supplier@evas.com",
    "changes": null
  }
]
```

### 6.2 action 유형

| action | 설명 | 수행자 |
|--------|------|--------|
| created | 발주 생성 | 바이어 |
| submitted | 발주 제출 | 바이어 |
| qty_adjusted | 수량 조정 | 매니저 |
| confirmed | 발주 확정 | 매니저 |
| packing_started | 패킹 시작 | 공급사 |
| shipped | 출고 완료 | 공급사 |
| completed | 거래 완료 | 시스템 |
| cancelled | 발주 취소 | 바이어/매니저 |

---

## 7. API 엔드포인트 설계

### 7.1 발주 CRUD

| Method | Endpoint | 설명 | 권한 |
|--------|----------|------|------|
| GET | `/api/orders` | 발주 목록 | all |
| GET | `/api/orders/[id]` | 발주 상세 | all |
| POST | `/api/orders` | 발주 생성 | buyer |
| PATCH | `/api/orders/[id]` | 발주 수정 | buyer(DRAFT), manager(CONFIRMED) |
| DELETE | `/api/orders/[id]` | 발주 삭제 | buyer(DRAFT only) |

### 7.2 발주 상태 변경

| Method | Endpoint | 설명 | 권한 |
|--------|----------|------|------|
| POST | `/api/orders/[id]/confirm` | 확정 | manager |
| POST | `/api/orders/[id]/cancel` | 취소 | buyer, manager |
| POST | `/api/orders/[id]/ship` | 출고 | supplier |
| POST | `/api/orders/[id]/complete` | 완료 | manager |

### 7.3 발주 품목

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/orders/[id]/items` | 품목 목록 |
| POST | `/api/orders/[id]/items` | 품목 추가 |
| PATCH | `/api/orders/[id]/items/[itemId]` | 품목 수정 |
| DELETE | `/api/orders/[id]/items/[itemId]` | 품목 삭제 |

---

## 8. 상태 전이 제약

### 8.1 허용된 전이

| 현재 상태 | 가능한 다음 상태 | 실행자 |
|----------|-----------------|--------|
| DRAFT | CONFIRMED | manager |
| DRAFT | CANCELLED | buyer, manager |
| CONFIRMED | PACKING | supplier |
| CONFIRMED | CANCELLED | manager |
| PACKING | SHIPPED | supplier |
| SHIPPED | COMPLETED | manager |

### 8.2 검증 로직

```typescript
const VALID_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  DRAFT: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PACKING', 'CANCELLED'],
  PACKING: ['SHIPPED'],
  SHIPPED: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: [],
};

function canTransition(current: OrderStatus, next: OrderStatus): boolean {
  return VALID_TRANSITIONS[current].includes(next);
}
```

---

## 9. 재고 연동 (CM 시스템)

### 9.1 재고 조회

```sql
-- 품목별 현재 재고
SELECT product_id, name, bal_qty
FROM cm_erp_products
WHERE product_id = 'PDSP009';

-- LOT별 잔여 현황 (FIFO)
SELECT product_id, current_stock, lot_numbers, remaining_quantities
FROM cm_product_lot_fifo
WHERE product_id = 'PDSP009';
```

### 9.2 발주 화면에서 재고 표시

```
제품 선택 시:
┌─────────────────────────────────────────────────────────┐
│ PDSP009 - 페디슨 샴푸 500ml                              │
│                                                         │
│ 현재고: 2,500개                                          │
│ LOT: S5129(1,500), S5180(1,000)                         │
│ 유통기한: 2028-03-15 (S5129), 2028-04-20 (S5180)         │
└─────────────────────────────────────────────────────────┘
```

---

## 10. 구현 우선순위

### Phase 1: 발주 생성 (MVP)
1. 발주 목록 페이지
2. 발주 생성 폼
3. 제품 선택 모달
4. 발주 상세 페이지

### Phase 2: 상태 관리
5. 상태 변경 버튼
6. 이력 표시
7. 권한별 UI 분기

### Phase 3: 패킹/출고
8. 패킹리스트 생성
9. PDF 출력
10. 재고 연동 표시
