-- LOT 제조일 테이블
-- CSV 데이터: Lot No, DATE (예: B5113, 2025.6.13 0:00)

CREATE TABLE IF NOT EXISTS cm_lot_manufacturing_dates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lot_number VARCHAR(50) NOT NULL,
  manufacturing_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- 동일 LOT의 중복 방지 (같은 LOT에 여러 제조일이 있을 수 있음)
  UNIQUE(lot_number, manufacturing_date)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_lot_mfg_dates_lot_number ON cm_lot_manufacturing_dates(lot_number);
CREATE INDEX IF NOT EXISTS idx_lot_mfg_dates_date ON cm_lot_manufacturing_dates(manufacturing_date);

-- RLS 정책
ALTER TABLE cm_lot_manufacturing_dates ENABLE ROW LEVEL SECURITY;

-- 모든 인증된 사용자가 조회 가능
CREATE POLICY "lot_mfg_dates_select_policy" ON cm_lot_manufacturing_dates
  FOR SELECT USING (true);

-- admin, supplier만 수정 가능
CREATE POLICY "lot_mfg_dates_insert_policy" ON cm_lot_manufacturing_dates
  FOR INSERT WITH CHECK (true);

CREATE POLICY "lot_mfg_dates_update_policy" ON cm_lot_manufacturing_dates
  FOR UPDATE USING (true);

-- 코멘트
COMMENT ON TABLE cm_lot_manufacturing_dates IS 'LOT별 제조일 정보';
COMMENT ON COLUMN cm_lot_manufacturing_dates.lot_number IS 'LOT 번호';
COMMENT ON COLUMN cm_lot_manufacturing_dates.manufacturing_date IS '제조일';
