-- =============================================
-- RUboard 스키마 업데이트 v1.2
-- 실제 데이터 기반 필드 추가/변경
-- =============================================

-- 0. ru_products: barcode 길이 확장 (다중 바코드 지원)
ALTER TABLE ru_products ALTER COLUMN barcode TYPE VARCHAR(100);

-- 0.1 ru_orders: id를 UUID에서 VARCHAR로 변경 (RU-2025-01 형식 지원)
ALTER TABLE ru_packing_lists DROP CONSTRAINT IF EXISTS ru_packing_lists_order_id_fkey;
ALTER TABLE ru_order_items DROP CONSTRAINT IF EXISTS ru_order_items_order_id_fkey;
ALTER TABLE ru_orders ALTER COLUMN id TYPE VARCHAR(20) USING id::VARCHAR(20);
ALTER TABLE ru_packing_lists ALTER COLUMN order_id TYPE VARCHAR(20);
ALTER TABLE ru_order_items ALTER COLUMN order_id TYPE VARCHAR(20);
ALTER TABLE ru_packing_lists ADD CONSTRAINT ru_packing_lists_order_id_fkey
  FOREIGN KEY (order_id) REFERENCES ru_orders(id) ON DELETE CASCADE;
ALTER TABLE ru_order_items ADD CONSTRAINT ru_order_items_order_id_fkey
  FOREIGN KEY (order_id) REFERENCES ru_orders(id) ON DELETE CASCADE;

-- 1. ru_products: hscode 추가
ALTER TABLE ru_products ADD COLUMN IF NOT EXISTS hscode VARCHAR(20);

-- 2. ru_orders: destination 추가
ALTER TABLE ru_orders ADD COLUMN IF NOT EXISTS destination VARCHAR(100);

-- 3. ru_order_items: 가격 상세 필드 추가
ALTER TABLE ru_order_items ADD COLUMN IF NOT EXISTS supply_price DECIMAL(12,0) DEFAULT 0;
ALTER TABLE ru_order_items ADD COLUMN IF NOT EXISTS commission DECIMAL(12,0) DEFAULT 0;

-- 4. ru_packing_items: pallet_number 추가 (숫자형)
ALTER TABLE ru_packing_items ADD COLUMN IF NOT EXISTS pallet_number INTEGER;

-- 5. ru_prices: 컬럼명 변경 (base_price → supply_price)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'ru_prices' AND column_name = 'base_price'
  ) THEN
    ALTER TABLE ru_prices RENAME COLUMN base_price TO supply_price;
  END IF;
END $$;

-- 6. ru_current_prices 뷰 재생성 (컬럼명 변경 반영)
DROP VIEW IF EXISTS ru_current_prices;
CREATE VIEW ru_current_prices AS
SELECT DISTINCT ON (product_code)
  product_code,
  supply_price,
  commission,
  final_price,
  effective_date
FROM ru_prices
WHERE effective_date <= CURRENT_DATE
ORDER BY product_code, effective_date DESC;

-- =============================================
-- 완료 메시지
-- =============================================
SELECT 'Schema update v1.1 completed!' AS result;
