-- ru_order_items에 출고 가능 여부 필드 추가
-- availability_status: pending(기본), available, partial, unavailable
-- availability_note: 에바스 코멘트 (재고 부족 사유 등)

ALTER TABLE ru_order_items
ADD COLUMN IF NOT EXISTS availability_status VARCHAR(20) DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS availability_note TEXT;

-- 상태값 제약 추가
ALTER TABLE ru_order_items
ADD CONSTRAINT ru_order_items_availability_status_check
CHECK (availability_status IN ('pending', 'available', 'partial', 'unavailable'));

-- 인덱스 추가 (상태별 필터링용)
CREATE INDEX IF NOT EXISTS idx_ru_order_items_availability
ON ru_order_items(availability_status);

COMMENT ON COLUMN ru_order_items.availability_status IS '출고 가능 상태: pending(확인대기), available(가능), partial(일부가능), unavailable(불가)';
COMMENT ON COLUMN ru_order_items.availability_note IS '에바스 코멘트 (예: 재고 부족, 생산 예정일 등)';
