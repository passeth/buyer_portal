import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// POST: LOT 정보 저장/업데이트
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { product_id, lots } = body

    if (!product_id) {
      return NextResponse.json({ error: 'product_id is required' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // 기존 LOT 삭제
    await supabase
      .from('cm_production_lots')
      .delete()
      .eq('product_id', product_id)

    // 새 LOT 추가
    if (lots && lots.length > 0) {
      const newLots = lots.map((lot: { lotNumber: string; qty: number }, index: number) => ({
        lot_number: lot.lotNumber,
        product_id,
        produced_qty: lot.qty,
        production_date: new Date().toISOString().split('T')[0],
        expiry_date: null // 유통기한은 별도 관리
      }))

      const { error } = await supabase
        .from('cm_production_lots')
        .insert(newLots)

      if (error) {
        console.error('LOT insert error:', error)
        return NextResponse.json({ error: 'LOT 저장 실패' }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('LOT API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// GET: 특정 품목의 LOT 정보 조회
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('product_id')

    if (!productId) {
      return NextResponse.json({ error: 'product_id is required' }, { status: 400 })
    }

    const supabase = createAdminClient()

    const { data, error } = await supabase
      .from('cm_production_lots')
      .select('*')
      .eq('product_id', productId)
      .order('production_date', { ascending: false })

    if (error) {
      console.error('LOT fetch error:', error)
      return NextResponse.json({ error: 'LOT 조회 실패' }, { status: 500 })
    }

    return NextResponse.json({ lots: data || [] })
  } catch (error) {
    console.error('LOT GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
