-- =============================================
-- RUboard 간소화 스키마 v2
-- 10개 테이블로 단순화
-- =============================================

-- =============================================
-- 1. 사용자 테이블
-- =============================================
CREATE TABLE ru_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(50) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('buyer', 'manager', 'supplier', 'admin')),
  org_name VARCHAR(100),
  region_code VARCHAR(5),  -- KZ, RU, MO 등 (발주번호 생성용)
  phone VARCHAR(30),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ru_users_role ON ru_users(role);
CREATE INDEX idx_ru_users_region ON ru_users(region_code);

-- =============================================
-- 2. 제품 마스터 테이블
-- =============================================
CREATE TABLE ru_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_code VARCHAR(20) UNIQUE NOT NULL,
  name_ko VARCHAR(200) NOT NULL,
  name_en VARCHAR(200),
  name_ru VARCHAR(200),
  barcode VARCHAR(13),
  brand VARCHAR(50),
  category VARCHAR(50),
  volume VARCHAR(20),
  pcs_per_carton INTEGER DEFAULT 1,
  width_cm DECIMAL(6,2),
  height_cm DECIMAL(6,2),
  depth_cm DECIMAL(6,2),
  cbm DECIMAL(10,6),
  weight_kg DECIMAL(8,3),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ru_products_code ON ru_products(product_code);
CREATE INDEX idx_ru_products_brand ON ru_products(brand);
CREATE INDEX idx_ru_products_status ON ru_products(status);

-- =============================================
-- 3. 가격 테이블
-- =============================================
CREATE TABLE ru_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_code VARCHAR(20) NOT NULL REFERENCES ru_products(product_code) ON DELETE CASCADE,
  base_price DECIMAL(12,0) NOT NULL DEFAULT 0,      -- 본사 공급가
  commission DECIMAL(12,0) NOT NULL DEFAULT 0,      -- 커미션
  final_price DECIMAL(12,0) NOT NULL DEFAULT 0,     -- 최종 공급가
  effective_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ru_prices_product ON ru_prices(product_code);
CREATE INDEX idx_ru_prices_date ON ru_prices(effective_date DESC);

-- 현재 유효 가격 조회용 뷰
CREATE VIEW ru_current_prices AS
SELECT DISTINCT ON (product_code)
  product_code,
  base_price,
  commission,
  final_price,
  effective_date
FROM ru_prices
WHERE effective_date <= CURRENT_DATE
ORDER BY product_code, effective_date DESC;

-- =============================================
-- 4. 재고 테이블
-- =============================================
CREATE TABLE ru_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_code VARCHAR(20) NOT NULL REFERENCES ru_products(product_code) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 0,
  expiry_date DATE,
  location VARCHAR(50),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by VARCHAR(50)
);

CREATE UNIQUE INDEX idx_ru_inventory_product ON ru_inventory(product_code);

-- =============================================
-- 5. 생산 일정 테이블
-- =============================================
CREATE TABLE ru_production (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_code VARCHAR(20) NOT NULL REFERENCES ru_products(product_code) ON DELETE CASCADE,
  planned_date DATE NOT NULL,
  planned_qty INTEGER NOT NULL,
  status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ru_production_product ON ru_production(product_code);
CREATE INDEX idx_ru_production_date ON ru_production(planned_date);

-- =============================================
-- 6. 발주서 테이블
-- =============================================
CREATE TABLE ru_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number VARCHAR(20) UNIQUE NOT NULL,
  buyer_id UUID REFERENCES ru_users(id),
  buyer_name VARCHAR(100),
  order_date DATE DEFAULT CURRENT_DATE,
  desired_delivery VARCHAR(100),
  status VARCHAR(20) DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'CONFIRMED', 'PACKING', 'SHIPPED', 'COMPLETED', 'CANCELLED')),
  total_qty INTEGER DEFAULT 0,
  total_cartons INTEGER DEFAULT 0,
  total_amount DECIMAL(15,0) DEFAULT 0,
  remarks TEXT,
  history JSONB DEFAULT '[]',  -- [{date, action, by, changes}]
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_ru_orders_number ON ru_orders(order_number);
CREATE INDEX idx_ru_orders_buyer ON ru_orders(buyer_id);
CREATE INDEX idx_ru_orders_status ON ru_orders(status);
CREATE INDEX idx_ru_orders_date ON ru_orders(order_date DESC);

-- =============================================
-- 7. 발주 품목 테이블
-- =============================================
CREATE TABLE ru_order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES ru_orders(id) ON DELETE CASCADE,
  product_code VARCHAR(20) NOT NULL,
  product_name VARCHAR(200),
  requested_qty INTEGER NOT NULL CHECK (requested_qty > 0),
  confirmed_qty INTEGER,
  unit_price DECIMAL(12,0) DEFAULT 0,
  subtotal DECIMAL(15,0) DEFAULT 0,
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ru_order_items_order ON ru_order_items(order_id);
CREATE UNIQUE INDEX idx_ru_order_items_unique ON ru_order_items(order_id, product_code);

-- =============================================
-- 8. 패킹리스트 테이블
-- =============================================
CREATE TABLE ru_packing_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES ru_orders(id) ON DELETE CASCADE,
  pl_number VARCHAR(30) UNIQUE NOT NULL,
  invoice_number VARCHAR(30),
  invoice_date DATE,
  created_date DATE DEFAULT CURRENT_DATE,
  -- Exporter 정보
  exporter_name VARCHAR(100),
  exporter_address TEXT,
  exporter_tel VARCHAR(50),
  exporter_fax VARCHAR(50),
  -- Consignee 정보
  consignee_name VARCHAR(100),
  consignee_address TEXT,
  consignee_tel VARCHAR(50),
  consignee_email VARCHAR(100),
  -- Shipping 정보
  manufacturer VARCHAR(100),
  shipping_port VARCHAR(50),
  departure_date DATE,
  destination VARCHAR(100),
  vessel_flight VARCHAR(100),
  payment_term VARCHAR(50),
  -- 품목 요약
  main_item VARCHAR(100),
  hs_code VARCHAR(20),
  commodity_desc TEXT,
  -- 합계
  total_qty INTEGER DEFAULT 0,
  total_cartons INTEGER DEFAULT 0,
  total_nw_kg DECIMAL(10,2) DEFAULT 0,
  total_gw_kg DECIMAL(10,2) DEFAULT 0,
  total_cbm DECIMAL(10,4) DEFAULT 0,
  total_pallets INTEGER DEFAULT 0,
  total_amount DECIMAL(15,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ru_packing_lists_order ON ru_packing_lists(order_id);

-- =============================================
-- 9. 패킹 상세 테이블
-- =============================================
CREATE TABLE ru_packing_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  packing_list_id UUID NOT NULL REFERENCES ru_packing_lists(id) ON DELETE CASCADE,
  product_code VARCHAR(20) NOT NULL,
  product_name VARCHAR(200),
  qty INTEGER NOT NULL,
  cartons INTEGER DEFAULT 0,
  nw_kg DECIMAL(10,3) DEFAULT 0,
  gw_kg DECIMAL(10,3) DEFAULT 0,
  cbm DECIMAL(10,6) DEFAULT 0,
  pallets INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ru_packing_items_pl ON ru_packing_items(packing_list_id);

-- =============================================
-- 10. 인보이스 상세 테이블
-- =============================================
CREATE TABLE ru_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  packing_list_id UUID NOT NULL REFERENCES ru_packing_lists(id) ON DELETE CASCADE,
  product_code VARCHAR(20) NOT NULL,
  product_name VARCHAR(200),
  qty INTEGER NOT NULL,
  unit_price DECIMAL(12,2) DEFAULT 0,
  amount DECIMAL(15,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ru_invoices_pl ON ru_invoices(packing_list_id);

-- =============================================
-- 발주번호 시퀀스 테이블 (간단 버전)
-- =============================================
CREATE TABLE ru_order_sequences (
  region_year VARCHAR(10) PRIMARY KEY,  -- 예: KZ-2026
  current_seq INTEGER DEFAULT 0
);

-- =============================================
-- 함수: 발주번호 자동 생성
-- =============================================
CREATE OR REPLACE FUNCTION ru_generate_order_number(p_region_code VARCHAR)
RETURNS VARCHAR AS $$
DECLARE
  v_year INTEGER;
  v_key VARCHAR;
  v_seq INTEGER;
BEGIN
  v_year := EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER;
  v_key := UPPER(COALESCE(p_region_code, 'XX')) || '-' || v_year;

  INSERT INTO ru_order_sequences (region_year, current_seq)
  VALUES (v_key, 1)
  ON CONFLICT (region_year)
  DO UPDATE SET current_seq = ru_order_sequences.current_seq + 1
  RETURNING current_seq INTO v_seq;

  RETURN v_key || '-' || LPAD(v_seq::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- 함수: updated_at 자동 업데이트
-- =============================================
CREATE OR REPLACE FUNCTION ru_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- updated_at 트리거
CREATE TRIGGER tr_ru_users_updated BEFORE UPDATE ON ru_users
  FOR EACH ROW EXECUTE FUNCTION ru_update_timestamp();

CREATE TRIGGER tr_ru_products_updated BEFORE UPDATE ON ru_products
  FOR EACH ROW EXECUTE FUNCTION ru_update_timestamp();

CREATE TRIGGER tr_ru_orders_updated BEFORE UPDATE ON ru_orders
  FOR EACH ROW EXECUTE FUNCTION ru_update_timestamp();

CREATE TRIGGER tr_ru_production_updated BEFORE UPDATE ON ru_production
  FOR EACH ROW EXECUTE FUNCTION ru_update_timestamp();

-- =============================================
-- 함수: 발주 합계 자동 계산
-- =============================================
CREATE OR REPLACE FUNCTION ru_update_order_totals()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE ru_orders SET
    total_qty = (SELECT COALESCE(SUM(COALESCE(confirmed_qty, requested_qty)), 0) FROM ru_order_items WHERE order_id = COALESCE(NEW.order_id, OLD.order_id)),
    total_amount = (SELECT COALESCE(SUM(subtotal), 0) FROM ru_order_items WHERE order_id = COALESCE(NEW.order_id, OLD.order_id))
  WHERE id = COALESCE(NEW.order_id, OLD.order_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_ru_order_items_totals
AFTER INSERT OR UPDATE OR DELETE ON ru_order_items
FOR EACH ROW EXECUTE FUNCTION ru_update_order_totals();

-- =============================================
-- 초기 데이터: 테스트용 사용자
-- =============================================
INSERT INTO ru_users (email, name, role, org_name, region_code) VALUES
  ('buyer@kz.com', 'KZ Buyer', 'buyer', 'Kazakhstan Cosmetics', 'KZ'),
  ('manager@inderton.com', 'IDT Manager', 'manager', 'Inderton Korea', 'KR'),
  ('supplier@evas.com', 'Evas Supplier', 'supplier', 'Evas Cosmetic', 'KR'),
  ('admin@ruboard.com', 'Admin', 'admin', 'RUboard', 'KR');

-- =============================================
-- 완료 메시지
-- =============================================
SELECT 'Simplified schema created successfully! (10 tables)' AS result;
