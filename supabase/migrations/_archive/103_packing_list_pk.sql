-- =============================================
-- RUboard 스키마 업데이트 v1.4
-- ru_packing_lists: id(UUID) → pl_number(VARCHAR) PK로 변경
-- =============================================

-- 1. 기존 FK 제약조건 제거
ALTER TABLE ru_packing_items DROP CONSTRAINT IF EXISTS ru_packing_items_pl_fkey;
ALTER TABLE ru_packing_items DROP CONSTRAINT IF EXISTS ru_packing_items_packing_list_id_fkey;
ALTER TABLE ru_invoices DROP CONSTRAINT IF EXISTS ru_invoices_packing_list_id_fkey;

-- 2. ru_packing_lists: id 컬럼 제거, pl_number를 PK로
ALTER TABLE ru_packing_lists DROP CONSTRAINT IF EXISTS ru_packing_lists_pkey;
ALTER TABLE ru_packing_lists DROP COLUMN IF EXISTS id;
ALTER TABLE ru_packing_lists ADD PRIMARY KEY (pl_number);

-- 3. ru_packing_items: packing_list_id를 VARCHAR로 변경
ALTER TABLE ru_packing_items ALTER COLUMN packing_list_id TYPE VARCHAR(50);

-- 4. ru_invoices: packing_list_id를 VARCHAR로 변경 (있는 경우)
ALTER TABLE ru_invoices ALTER COLUMN packing_list_id TYPE VARCHAR(50);

-- 5. FK 재생성
ALTER TABLE ru_packing_items ADD CONSTRAINT ru_packing_items_packing_list_id_fkey
  FOREIGN KEY (packing_list_id) REFERENCES ru_packing_lists(pl_number) ON DELETE CASCADE;

ALTER TABLE ru_invoices ADD CONSTRAINT ru_invoices_packing_list_id_fkey
  FOREIGN KEY (packing_list_id) REFERENCES ru_packing_lists(pl_number) ON DELETE CASCADE;

-- 6. 완료 메시지
SELECT 'ru_packing_lists PK changed to pl_number!' AS result;
