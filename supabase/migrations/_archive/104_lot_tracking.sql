-- =============================================
-- LOT 재고 추적 시스템 (ARRAY 기반 FIFO)
-- =============================================

-- 기존 객체 삭제
DROP VIEW IF EXISTS cm_lots_expiring_soon CASCADE;
DROP VIEW IF EXISTS cm_product_lot_fifo CASCADE;
DROP VIEW IF EXISTS cm_lot_inventory CASCADE;
DROP VIEW IF EXISTS cm_product_lots_array CASCADE;
DROP FUNCTION IF EXISTS cm_calculate_lot_remaining CASCADE;
DROP TABLE IF EXISTS cm_production_lots CASCADE;

-- 1. LOT 생산 내역 테이블 (각 생산 건별로 개별 저장)
-- FK 제거: ERP에 없는 품목도 LOT 이력 유지 (재고 0 → 재입고 시 이력 필요)
CREATE TABLE cm_production_lots (
  id SERIAL PRIMARY KEY,
  lot_number VARCHAR(20) NOT NULL,
  product_id TEXT NOT NULL,
  produced_qty INTEGER NOT NULL,
  production_date DATE NOT NULL,
  expiry_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cm_lots_product ON cm_production_lots(product_id);
CREATE INDEX idx_cm_lots_lot ON cm_production_lots(lot_number);
CREATE INDEX idx_cm_lots_date ON cm_production_lots(production_date DESC);

-- 2. 품목별 LOT 배열 VIEW (최신순 정렬)
CREATE OR REPLACE VIEW cm_product_lots_array AS
SELECT
  p.product_id,
  p.name AS product_name,
  p.bal_qty AS current_stock,
  ARRAY_AGG(l.lot_number ORDER BY l.production_date DESC) AS lot_numbers,
  ARRAY_AGG(l.produced_qty ORDER BY l.production_date DESC) AS lot_quantities,
  ARRAY_AGG(l.production_date ORDER BY l.production_date DESC) AS lot_dates,
  ARRAY_AGG(l.expiry_date ORDER BY l.production_date DESC) AS lot_expiries,
  SUM(l.produced_qty) AS total_produced
FROM cm_erp_products p
LEFT JOIN cm_production_lots l ON p.product_id = l.product_id
GROUP BY p.product_id, p.name, p.bal_qty;

-- 3. FIFO 역산 함수: 현재고를 LOT에 배분
CREATE OR REPLACE FUNCTION cm_calculate_lot_remaining(
  p_product_id TEXT
) RETURNS TABLE (
  id INTEGER,
  lot_number VARCHAR(20),
  produced_qty INTEGER,
  remaining_qty INTEGER,
  production_date DATE,
  expiry_date DATE,
  status TEXT
) AS $$
DECLARE
  v_current_stock INTEGER;
  v_remaining INTEGER;
  v_lot RECORD;
BEGIN
  SELECT bal_qty INTO v_current_stock
  FROM cm_erp_products
  WHERE product_id = p_product_id;

  v_remaining := COALESCE(v_current_stock, 0);

  FOR v_lot IN
    SELECT l.id, l.lot_number, l.produced_qty, l.production_date, l.expiry_date
    FROM cm_production_lots l
    WHERE l.product_id = p_product_id
    ORDER BY l.production_date DESC, l.id DESC
  LOOP
    IF v_remaining <= 0 THEN
      id := v_lot.id;
      lot_number := v_lot.lot_number;
      produced_qty := v_lot.produced_qty;
      remaining_qty := 0;
      production_date := v_lot.production_date;
      expiry_date := v_lot.expiry_date;
      status := 'depleted';
    ELSIF v_remaining >= v_lot.produced_qty THEN
      id := v_lot.id;
      lot_number := v_lot.lot_number;
      produced_qty := v_lot.produced_qty;
      remaining_qty := v_lot.produced_qty;
      production_date := v_lot.production_date;
      expiry_date := v_lot.expiry_date;
      status := 'active';
      v_remaining := v_remaining - v_lot.produced_qty;
    ELSE
      id := v_lot.id;
      lot_number := v_lot.lot_number;
      produced_qty := v_lot.produced_qty;
      remaining_qty := v_remaining;
      production_date := v_lot.production_date;
      expiry_date := v_lot.expiry_date;
      status := 'partial';
      v_remaining := 0;
    END IF;
    RETURN NEXT;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 4. 품목별 LOT 잔여 현황 VIEW (FIFO 적용)
CREATE OR REPLACE VIEW cm_lot_inventory AS
SELECT
  p.product_id,
  p.name AS product_name,
  p.bal_qty AS current_stock,
  r.id,
  r.lot_number,
  r.produced_qty,
  r.remaining_qty,
  r.production_date,
  r.expiry_date,
  r.status
FROM cm_erp_products p
CROSS JOIN LATERAL cm_calculate_lot_remaining(p.product_id) r
WHERE p.bal_qty > 0;

-- 5. 품목별 FIFO 요약 VIEW (배열 + 잔여량 배열)
CREATE OR REPLACE VIEW cm_product_lot_fifo AS
SELECT
  p.product_id,
  p.name AS product_name,
  p.bal_qty AS current_stock,
  ARRAY_AGG(r.lot_number ORDER BY r.production_date DESC, r.id DESC) AS lot_numbers,
  ARRAY_AGG(r.produced_qty ORDER BY r.production_date DESC, r.id DESC) AS produced_quantities,
  ARRAY_AGG(r.remaining_qty ORDER BY r.production_date DESC, r.id DESC) AS remaining_quantities,
  ARRAY_AGG(r.status ORDER BY r.production_date DESC, r.id DESC) AS lot_statuses,
  SUM(r.remaining_qty) AS total_remaining
FROM cm_erp_products p
CROSS JOIN LATERAL cm_calculate_lot_remaining(p.product_id) r
WHERE p.bal_qty > 0
GROUP BY p.product_id, p.name, p.bal_qty;

-- 6. 유통기한 임박 LOT (3개월 내)
CREATE OR REPLACE VIEW cm_lots_expiring_soon AS
SELECT *
FROM cm_lot_inventory
WHERE remaining_qty > 0
  AND expiry_date IS NOT NULL
  AND expiry_date <= CURRENT_DATE + INTERVAL '3 months'
ORDER BY expiry_date ASC;

SELECT 'LOT tracking system created!' AS result;
