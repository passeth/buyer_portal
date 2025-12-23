import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

interface RouteParams {
  params: Promise<{ id: string; itemId: string }>
}

// PATCH: 품목별 출고 가능 여부 업데이트 (에바스용)
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: orderId, itemId } = await params
    const body = await request.json()
    const supabase = createAdminClient()

    // 발주 품목 존재 확인
    const { data: existing, error: existingError } = await supabase
      .from('ru_order_items')
      .select('id, order_id, product_code, requested_qty')
      .eq('id', itemId)
      .eq('order_id', orderId)
      .single()

    if (existingError || !existing) {
      return NextResponse.json(
        { error: '발주 품목을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 업데이트 가능 필드
    const updateData: Record<string, unknown> = {}

    // availability_status: pending | available | partial | unavailable
    if (body.availability_status !== undefined) {
      const validStatuses = ['pending', 'available', 'partial', 'unavailable']
      if (!validStatuses.includes(body.availability_status)) {
        return NextResponse.json(
          { error: `유효하지 않은 상태입니다. (${validStatuses.join(', ')})` },
          { status: 400 }
        )
      }
      updateData.availability_status = body.availability_status
    }

    // availability_note: 에바스 코멘트
    if (body.availability_note !== undefined) {
      updateData.availability_note = body.availability_note
    }

    // confirmed_qty: 출고 가능 수량 (partial인 경우)
    if (body.confirmed_qty !== undefined) {
      const confirmedQty = parseInt(body.confirmed_qty)
      if (isNaN(confirmedQty) || confirmedQty < 0) {
        return NextResponse.json(
          { error: '확정 수량은 0 이상이어야 합니다.' },
          { status: 400 }
        )
      }
      updateData.confirmed_qty = confirmedQty

      // 금액 재계산 (confirmed_qty 기준)
      const { data: item } = await supabase
        .from('ru_order_items')
        .select('supply_price, commission, unit_price')
        .eq('id', itemId)
        .single()

      if (item) {
        updateData.supply_total = (item.supply_price || 0) * confirmedQty
        updateData.commission_total = (item.commission || 0) * confirmedQty
        updateData.subtotal = (item.unit_price || 0) * confirmedQty
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: '업데이트할 데이터가 없습니다.' },
        { status: 400 }
      )
    }

    // 품목 업데이트
    const { data: updated, error: updateError } = await supabase
      .from('ru_order_items')
      .update(updateData)
      .eq('id', itemId)
      .select()
      .single()

    if (updateError) {
      console.error('Order item update error:', updateError)
      return NextResponse.json(
        { error: '품목 업데이트 실패' },
        { status: 500 }
      )
    }

    // 발주 이력에 기록
    if (body.availability_status) {
      const { data: order } = await supabase
        .from('ru_orders')
        .select('history')
        .eq('id', orderId)
        .single()

      if (order) {
        const history = order.history || []
        history.push({
          date: new Date().toISOString(),
          action: 'item_availability_updated',
          by: body.updated_by || 'supplier',
          changes: `${existing.product_code}: ${body.availability_status}${body.confirmed_qty !== undefined ? ` (${body.confirmed_qty}개)` : ''}`
        })

        await supabase
          .from('ru_orders')
          .update({ history })
          .eq('id', orderId)
      }
    }

    return NextResponse.json({
      success: true,
      item: updated
    })

  } catch (error) {
    console.error('Order item API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '품목 업데이트 중 오류 발생' },
      { status: 500 }
    )
  }
}

// GET: 품목 상세 조회
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id: orderId, itemId } = await params
    const supabase = createAdminClient()

    const { data: item, error } = await supabase
      .from('ru_order_items')
      .select('*')
      .eq('id', itemId)
      .eq('order_id', orderId)
      .single()

    if (error || !item) {
      return NextResponse.json(
        { error: '발주 품목을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      item
    })

  } catch (error) {
    console.error('Order item GET error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '품목 조회 중 오류 발생' },
      { status: 500 }
    )
  }
}
