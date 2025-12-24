// LOT 제조일 CSV 데이터 임포트 스크립트
// 사용법: npx ts-node data_migration/import_lot_dates.ts

import { createClient } from '@supabase/supabase-js'
import * as fs from 'fs'
import * as path from 'path'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabase = createClient(supabaseUrl, supabaseKey)

interface LotDateRow {
  lot_number: string
  manufacturing_date: string  // YYYY-MM-DD format
}

function parseDate(dateStr: string): string {
  // 입력 형식: "2025.6.13 0:00" -> 출력: "2025-06-13"
  const match = dateStr.match(/(\d{4})\.(\d{1,2})\.(\d{1,2})/)
  if (!match) {
    throw new Error(`Invalid date format: ${dateStr}`)
  }

  const year = match[1]
  const month = match[2].padStart(2, '0')
  const day = match[3].padStart(2, '0')

  return `${year}-${month}-${day}`
}

async function importLotDates() {
  const csvPath = path.join(__dirname, 'LOTHX_1.csv')
  const csvContent = fs.readFileSync(csvPath, 'utf-8')

  const lines = csvContent.split('\n').filter(line => line.trim())
  const rows: LotDateRow[] = []

  // 첫 줄(헤더) 제외
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    const [lotNumber, dateStr] = line.split(',').map(s => s.trim())

    if (!lotNumber || !dateStr) continue

    try {
      const manufacturingDate = parseDate(dateStr)
      rows.push({
        lot_number: lotNumber,
        manufacturing_date: manufacturingDate
      })
    } catch (error) {
      console.error(`Error parsing line ${i + 1}: ${line}`, error)
    }
  }

  console.log(`Parsed ${rows.length} rows`)

  // Supabase에 upsert
  const { data, error } = await supabase
    .from('cm_lot_manufacturing_dates')
    .upsert(rows, {
      onConflict: 'lot_number,manufacturing_date',
      ignoreDuplicates: true
    })

  if (error) {
    console.error('Import error:', error)
  } else {
    console.log('Import successful!')
  }
}

importLotDates().catch(console.error)
