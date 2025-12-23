import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

// POST: 신제품 등록
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const supabase = createAdminClient()

    // 필수 필드 검증
    if (!body.product_code || !body.name_ko) {
      return NextResponse.json(
        { error: '품목코드와 품목명(한글)은 필수입니다.' },
        { status: 400 }
      )
    }

    // 중복 검사
    const { data: existing } = await supabase
      .from('ru_products')
      .select('id')
      .eq('product_code', body.product_code)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: '이미 존재하는 품목코드입니다.' },
        { status: 400 }
      )
    }

    // CBM 계산
    let cbm = null
    if (body.width_cm && body.height_cm && body.depth_cm) {
      cbm = (Number(body.width_cm) * Number(body.height_cm) * Number(body.depth_cm)) / 1000000
    }

    // 제품 등록
    const { data: product, error: productError } = await supabase
      .from('ru_products')
      .insert({
        product_code: body.product_code,
        name_ko: body.name_ko,
        name_en: body.name_en || null,
        name_ru: body.name_ru || null,
        barcode: body.barcode || null,
        brand: body.brand === '__new__' ? null : body.brand || null,
        category: body.category || null,
        volume: body.volume || null,
        pcs_per_carton: body.pcs_per_carton || 1,
        width_cm: body.width_cm ? Number(body.width_cm) : null,
        height_cm: body.height_cm ? Number(body.height_cm) : null,
        depth_cm: body.depth_cm ? Number(body.depth_cm) : null,
        cbm,
        weight_kg: body.weight_kg ? Number(body.weight_kg) : null,
        hscode: body.hscode || null,
        status: body.status || 'active',
        remarks: body.remarks || null,
      })
      .select()
      .single()

    if (productError) {
      console.error('Product insert error:', productError)
      return NextResponse.json(
        { error: '제품 등록 실패' },
        { status: 500 }
      )
    }

    // 가격 등록 (가격이 있는 경우)
    if (body.supply_price || body.commission || body.final_price) {
      const { error: priceError } = await supabase
        .from('ru_prices')
        .insert({
          product_code: body.product_code,
          supply_price: body.supply_price || 0,
          commission: body.commission || 0,
          final_price: body.final_price || (body.supply_price || 0) + (body.commission || 0),
          effective_date: new Date().toISOString().split('T')[0]
        })

      if (priceError) {
        console.error('Price insert error:', priceError)
        // 가격 오류는 경고만 표시 (제품은 등록됨)
      }
    }

    return NextResponse.json({
      success: true,
      product
    })

  } catch (error) {
    console.error('Product API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '제품 등록 중 오류 발생' },
      { status: 500 }
    )
  }
}

// GET: 제품 목록 조회
export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const { searchParams } = new URL(request.url)

    const brand = searchParams.get('brand')
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    let query = supabase
      .from('ru_products')
      .select('*')
      .order('product_code', { ascending: true })

    if (brand) {
      query = query.eq('brand', brand)
    }

    if (status) {
      query = query.eq('status', status)
    }

    if (search) {
      query = query.or(`product_code.ilike.%${search}%,name_ko.ilike.%${search}%,barcode.ilike.%${search}%`)
    }

    const { data: products, error } = await query

    if (error) {
      console.error('Products fetch error:', error)
      return NextResponse.json(
        { error: '제품 조회 실패' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      products: products || []
    })

  } catch (error) {
    console.error('Products API error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '제품 조회 중 오류 발생' },
      { status: 500 }
    )
  }
}
