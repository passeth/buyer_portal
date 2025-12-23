import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

interface RouteParams {
  params: Promise<{ id: string }>
}

// GET: 제품 상세 조회
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = createAdminClient()

    const { data: product, error } = await supabase
      .from('ru_products')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !product) {
      return NextResponse.json(
        { error: '제품을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // 가격 조회
    const { data: price } = await supabase
      .from('ru_prices')
      .select('*')
      .eq('product_code', product.product_code)
      .order('effective_date', { ascending: false })
      .limit(1)
      .single()

    return NextResponse.json({
      success: true,
      product: {
        ...product,
        price: price || undefined
      }
    })

  } catch (error) {
    console.error('Product GET error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '제품 조회 중 오류 발생' },
      { status: 500 }
    )
  }
}

// PATCH: 제품 수정
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const body = await request.json()
    const supabase = createAdminClient()

    // 기존 제품 조회
    const { data: existing, error: existingError } = await supabase
      .from('ru_products')
      .select('product_code')
      .eq('id', id)
      .single()

    if (existingError || !existing) {
      return NextResponse.json(
        { error: '제품을 찾을 수 없습니다.' },
        { status: 404 }
      )
    }

    // CBM 계산
    let cbm = null
    if (body.width_cm && body.height_cm && body.depth_cm) {
      cbm = (Number(body.width_cm) * Number(body.height_cm) * Number(body.depth_cm)) / 1000000
    }

    // 제품 업데이트
    const updateData: Record<string, unknown> = {}

    // 업데이트 가능한 필드들
    if (body.name_ko !== undefined) updateData.name_ko = body.name_ko
    if (body.name_en !== undefined) updateData.name_en = body.name_en || null
    if (body.name_ru !== undefined) updateData.name_ru = body.name_ru || null
    if (body.barcode !== undefined) updateData.barcode = body.barcode || null
    if (body.brand !== undefined) updateData.brand = body.brand === '__new__' ? null : body.brand || null
    if (body.category !== undefined) updateData.category = body.category || null
    if (body.volume !== undefined) updateData.volume = body.volume || null
    if (body.pcs_per_carton !== undefined) updateData.pcs_per_carton = body.pcs_per_carton || 1
    if (body.width_cm !== undefined) updateData.width_cm = body.width_cm ? Number(body.width_cm) : null
    if (body.height_cm !== undefined) updateData.height_cm = body.height_cm ? Number(body.height_cm) : null
    if (body.depth_cm !== undefined) updateData.depth_cm = body.depth_cm ? Number(body.depth_cm) : null
    if (body.weight_kg !== undefined) updateData.weight_kg = body.weight_kg ? Number(body.weight_kg) : null
    if (body.hscode !== undefined) updateData.hscode = body.hscode || null
    if (body.status !== undefined) updateData.status = body.status
    if (body.remarks !== undefined) updateData.remarks = body.remarks || null

    // CBM 자동 계산
    if (cbm !== null) {
      updateData.cbm = cbm
    }

    const { data: product, error: updateError } = await supabase
      .from('ru_products')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Product update error:', updateError)
      return NextResponse.json(
        { error: '제품 수정 실패' },
        { status: 500 }
      )
    }

    // 가격 업데이트 (가격이 변경된 경우 새 가격 추가)
    if (body.supply_price !== undefined || body.commission !== undefined) {
      // 기존 가격 조회
      const { data: existingPrice } = await supabase
        .from('ru_prices')
        .select('*')
        .eq('product_code', existing.product_code)
        .order('effective_date', { ascending: false })
        .limit(1)
        .single()

      const newSupplyPrice = body.supply_price ?? existingPrice?.supply_price ?? 0
      const newCommission = body.commission ?? existingPrice?.commission ?? 0
      const newFinalPrice = newSupplyPrice + newCommission

      // 가격이 변경되었는지 확인
      const priceChanged =
        newSupplyPrice !== (existingPrice?.supply_price || 0) ||
        newCommission !== (existingPrice?.commission || 0)

      if (priceChanged) {
        const { error: priceError } = await supabase
          .from('ru_prices')
          .insert({
            product_code: existing.product_code,
            supply_price: newSupplyPrice,
            commission: newCommission,
            final_price: newFinalPrice,
            effective_date: new Date().toISOString().split('T')[0]
          })

        if (priceError) {
          console.error('Price update error:', priceError)
          // 가격 오류는 경고만 (제품은 업데이트됨)
        }
      }
    }

    return NextResponse.json({
      success: true,
      product
    })

  } catch (error) {
    console.error('Product PATCH error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '제품 수정 중 오류 발생' },
      { status: 500 }
    )
  }
}

// DELETE: 제품 삭제 (비활성화)
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = createAdminClient()

    // 비활성화 (실제 삭제 대신)
    const { error } = await supabase
      .from('ru_products')
      .update({ status: 'inactive' })
      .eq('id', id)

    if (error) {
      console.error('Product delete error:', error)
      return NextResponse.json(
        { error: '제품 비활성화 실패' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: '제품이 비활성화되었습니다.'
    })

  } catch (error) {
    console.error('Product DELETE error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '제품 삭제 중 오류 발생' },
      { status: 500 }
    )
  }
}
