# RUboard 데이터베이스 스키마

> **최종 업데이트**: 2025-12-23
> **Source of Truth**: `supabase/migrations/200_final_table_info.sql`

---

## 테이블 개요

### RU 시스템 테이블 (발주/패킹)

| 테이블 | 설명 | PK |
|--------|------|-----|
| `ru_users` | 사용자 (buyer/manager/supplier/admin) | id (UUID) |
| `ru_products` | 제품 마스터 | id (UUID), product_code (UK) |
| `ru_prices` | 가격 (본사가/커미션/최종가) | id (UUID) |
| `ru_orders` | 발주 헤더 | id (VARCHAR 20) |
| `ru_order_items` | 발주 품목 | id (UUID) |
| `ru_packing_lists` | 패킹리스트 헤더 | pl_number (VARCHAR 30) |
| `ru_packing_items` | 패킹 상세 | id (UUID) |

### CM 시스템 테이블 (재고/LOT)

| 테이블 | 설명 | PK |
|--------|------|-----|
| `cm_erp_products` | ERP 품목 (재고 연동) | product_id (TEXT) |
| `cm_production_lots` | LOT 생산 내역 | id (SERIAL) |

### Views (실시간 연산)

| View | 설명 |
|------|------|
| `cm_product_lots_array` | 품목별 LOT 배열 (원본) |
| `cm_lot_inventory` | LOT 잔여 현황 (FIFO) |
| `cm_product_lot_fifo` | FIFO 요약 (배열) |
| `cm_lots_expiring_soon` | 유통기한 임박 (3개월) |

---

## 1. ru_users (사용자)

```sql
CREATE TABLE ru_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(100) NOT NULL UNIQUE,
  name VARCHAR(50) NOT NULL,
  role VARCHAR(20) NOT NULL,        -- buyer, manager, supplier, admin
  org_name VARCHAR(100),
  region_code VARCHAR(5),           -- KZ, RU, BY
  phone VARCHAR(30),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

| 필드 | 타입 | 설명 |
|------|------|------|
| role | VARCHAR(20) | buyer, manager, supplier, admin |
| region_code | VARCHAR(5) | 지역코드 (발주번호 생성용) |

---

## 2. ru_products (제품)

```sql
CREATE TABLE ru_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_code VARCHAR(20) NOT NULL UNIQUE,
  name_ko VARCHAR(200) NOT NULL,
  name_en VARCHAR(200),
  name_ru VARCHAR(200),
  barcode VARCHAR(100),
  brand VARCHAR(50),
  category VARCHAR(50),
  volume VARCHAR(20),
  pcs_per_carton INTEGER DEFAULT 1,
  width_cm NUMERIC(6,2),
  height_cm NUMERIC(6,2),
  depth_cm NUMERIC(6,2),
  cbm NUMERIC(10,6),
  weight_kg NUMERIC(8,3),
  hscode VARCHAR(20),
  status VARCHAR(20) DEFAULT 'active',  -- active, inactive
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

| 필드 | 타입 | 설명 |
|------|------|------|
| product_code | VARCHAR(20) | 품목코드 (UK, 비즈니스 키) |
| pcs_per_carton | INTEGER | 카톤당 입수량 |
| hscode | VARCHAR(20) | HS코드 (관세) |

---

## 3. ru_prices (가격)

```sql
CREATE TABLE ru_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_code VARCHAR(20) NOT NULL REFERENCES ru_products(product_code) ON DELETE CASCADE,
  supply_price NUMERIC NOT NULL DEFAULT 0,   -- 본사가
  commission NUMERIC NOT NULL DEFAULT 0,     -- 커미션
  final_price NUMERIC NOT NULL DEFAULT 0,    -- 최종가 (supply + commission)
  effective_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

| 필드 | 타입 | 설명 |
|------|------|------|
| supply_price | NUMERIC | 본사가 (에바스) |
| commission | NUMERIC | 커미션 (인덜톤) |
| final_price | NUMERIC | 최종가 (supply + commission) |

---

## 4. ru_orders (발주)

```sql
CREATE TABLE ru_orders (
  id VARCHAR(20) PRIMARY KEY,              -- RU-2025-01 형식
  order_number VARCHAR(20) NOT NULL UNIQUE,
  buyer_id UUID REFERENCES ru_users(id),
  buyer_name VARCHAR(100),
  order_date DATE DEFAULT CURRENT_DATE,
  desired_delivery VARCHAR(100),
  destination VARCHAR(100),
  status VARCHAR(20) DEFAULT 'DRAFT',
  total_qty INTEGER DEFAULT 0,
  total_cartons INTEGER DEFAULT 0,
  total_amount NUMERIC DEFAULT 0,
  remarks TEXT,
  history JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);
```

**발주 상태 흐름**:
```
DRAFT → CONFIRMED → PACKING → SHIPPED → COMPLETED
  │         │
  └─────────┴──────→ CANCELLED
```

---

## 5. ru_order_items (발주 품목)

```sql
CREATE TABLE ru_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id VARCHAR(20) NOT NULL REFERENCES ru_orders(id) ON DELETE CASCADE,
  product_code VARCHAR(20) NOT NULL,
  product_name VARCHAR(200),
  destination VARCHAR(100),
  pcs_per_ctn INTEGER DEFAULT 0,
  requested_qty INTEGER NOT NULL CHECK (requested_qty > 0),
  confirmed_qty INTEGER,
  supply_price NUMERIC DEFAULT 0,          -- 본사가 단가
  commission NUMERIC DEFAULT 0,            -- 커미션 단가
  unit_price NUMERIC DEFAULT 0,            -- 최종 단가
  supply_total NUMERIC DEFAULT 0,          -- 본사가 합계
  commission_total NUMERIC DEFAULT 0,      -- 커미션 합계
  subtotal NUMERIC DEFAULT 0,              -- 최종 합계
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

| 필드 | 타입 | 설명 |
|------|------|------|
| destination | VARCHAR(100) | 목적지 (품목별) |
| supply_total | NUMERIC | 본사가 × 수량 |
| commission_total | NUMERIC | 커미션 × 수량 |
| subtotal | NUMERIC | 최종가 × 수량 |

---

## 6. ru_packing_lists (패킹리스트)

```sql
CREATE TABLE ru_packing_lists (
  pl_number VARCHAR(30) PRIMARY KEY,       -- PL-20250127-OV5
  order_id VARCHAR(20) NOT NULL REFERENCES ru_orders(id) ON DELETE CASCADE,
  invoice_number VARCHAR(30),
  invoice_date DATE,
  created_date DATE DEFAULT CURRENT_DATE,
  -- Exporter
  exporter_name VARCHAR(100),
  exporter_address TEXT,
  exporter_tel VARCHAR(50),
  exporter_fax VARCHAR(50),
  -- Consignee
  consignee_name VARCHAR(100),
  consignee_address TEXT,
  consignee_tel VARCHAR(50),
  consignee_email VARCHAR(100),
  -- Shipping
  manufacturer VARCHAR(100),
  shipping_port VARCHAR(50),
  departure_date DATE,
  destination VARCHAR(100),
  vessel_flight VARCHAR(100),
  payment_term VARCHAR(50),
  main_item VARCHAR(100),
  hs_code VARCHAR(20),
  commodity_desc TEXT,
  -- Totals
  total_qty INTEGER DEFAULT 0,
  total_cartons INTEGER DEFAULT 0,
  total_nw_kg NUMERIC(10,2) DEFAULT 0,
  total_gw_kg NUMERIC(10,2) DEFAULT 0,
  total_cbm NUMERIC(10,4) DEFAULT 0,
  total_pallets INTEGER DEFAULT 0,
  total_amount NUMERIC(15,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**PK 변경**: UUID → pl_number (VARCHAR 30)

---

## 7. ru_packing_items (패킹 상세)

```sql
CREATE TABLE ru_packing_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  packing_list_id VARCHAR(50) NOT NULL REFERENCES ru_packing_lists(pl_number) ON DELETE CASCADE,
  product_code VARCHAR(20) NOT NULL,
  product_name VARCHAR(200),
  qty INTEGER NOT NULL,
  cartons INTEGER DEFAULT 0,
  nw_kg NUMERIC(10,3) DEFAULT 0,
  gw_kg NUMERIC(10,3) DEFAULT 0,
  cbm NUMERIC(10,6) DEFAULT 0,
  pallets INTEGER DEFAULT 0,
  pallet_number INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 8. cm_erp_products (ERP 품목)

> **주의**: ERP 연동 데이터 (외부 시스템)

```sql
CREATE TABLE cm_erp_products (
  product_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  spec TEXT,
  bal_qty INTEGER DEFAULT 0,              -- 현재 재고
  warehouse_code TEXT DEFAULT 'W104',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

---

## 9. cm_production_lots (LOT 생산)

```sql
CREATE TABLE cm_production_lots (
  id SERIAL PRIMARY KEY,
  lot_number VARCHAR(20) NOT NULL,
  product_id TEXT NOT NULL,               -- FK 없음 (독립적 이력)
  produced_qty INTEGER NOT NULL,
  production_date DATE NOT NULL,
  expiry_date DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**FK 없음**: ERP에 없는 품목도 LOT 이력 유지 (재입고 시 필요)

---

## Views & Functions

### cm_calculate_lot_remaining (FIFO 함수)

현재고를 최신 LOT부터 역산 배분

```sql
SELECT * FROM cm_calculate_lot_remaining('BADML0000');
-- Returns: id, lot_number, produced_qty, remaining_qty, production_date, expiry_date, status
```

### cm_product_lot_fifo (FIFO 요약)

```sql
SELECT product_id, current_stock, lot_numbers, remaining_quantities, lot_statuses
FROM cm_product_lot_fifo
WHERE product_id = 'RRBM006';
```

**결과 예시**:
```json
{
  "product_id": "RRBM006",
  "current_stock": 2697,
  "lot_numbers": ["S5129", "S5180", "S5129", "S5110"],
  "remaining_quantities": [1500, 1000, 197, 0]
}
```

### cm_lots_expiring_soon (유통기한 임박)

```sql
SELECT * FROM cm_lots_expiring_soon LIMIT 10;
-- 3개월 내 유통기한 도래 LOT
```

---

## 테이블 관계도

```
ru_users
    │
    └──< ru_orders (buyer_id)
            │
            ├──< ru_order_items (order_id)
            │
            └──< ru_packing_lists (order_id)
                    │
                    └──< ru_packing_items (packing_list_id)

ru_products
    │
    └──< ru_prices (product_code)


cm_erp_products ─────┐
    │                │
    │    [VIEWS]     │
    │                │
cm_production_lots ──┘
```

---

## Triggers

| 테이블 | 트리거 | 기능 |
|--------|--------|------|
| ru_orders | tr_ru_orders_updated | updated_at 자동 갱신 |
| ru_order_items | tr_ru_order_items_totals | 발주 합계 자동 계산 |
| ru_products | tr_ru_products_updated | updated_at 자동 갱신 |
| ru_users | tr_ru_users_updated | updated_at 자동 갱신 |

---

## 마이그레이션 파일

| 파일 | 상태 | 설명 |
|------|------|------|
| `200_final_table_info.sql` | **현재** | Supabase 실제 스키마 |
| `_archive/100-104` | 아카이브 | 과거 마이그레이션 이력 |
