-- =============================================
-- RUboard 스키마 업데이트 v1.3
-- ru_order_items 확장 (destination, pcs_per_ctn 등)
-- =============================================

-- 1. ru_order_items: 새 컬럼 추가
ALTER TABLE ru_order_items ADD COLUMN IF NOT EXISTS destination VARCHAR(100);
ALTER TABLE ru_order_items ADD COLUMN IF NOT EXISTS pcs_per_ctn INTEGER DEFAULT 0;
ALTER TABLE ru_order_items ADD COLUMN IF NOT EXISTS supply_total DECIMAL(15,0) DEFAULT 0;
ALTER TABLE ru_order_items ADD COLUMN IF NOT EXISTS commission_total DECIMAL(15,0) DEFAULT 0;

-- 2. unique 제약조건 제거 (같은 월에 같은 제품이 다른 목적지로 갈 수 있음)
DROP INDEX IF EXISTS idx_ru_order_items_unique;

-- 3. 완료 메시지
SELECT 'ru_order_items updated with destination columns!' AS result;
