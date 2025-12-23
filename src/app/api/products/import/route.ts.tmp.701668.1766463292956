import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

interface ImportProduct {
  product_code: string
  name_ko: string
  name_en?: string
  name_ru?: string
  barcode?: string
  brand?: string
  category?: string
  volume?: string
  pcs_per_carton: number
  base_price_krw: number
  remarks?: string
}

export async function POST(request: NextRequest) {
  try {
    const { products } = await request.json() as { products: ImportProduct[] }

    if (!products || !Array.isArray(products) || products.length === 0) {
      return NextResponse.json(
        { error: '유효한 제품 데이터가 없습니다.' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    let inserted = 0
    let updated = 0
    const errors: string[] = []

    for (const product of products) {
      // 기존 제품 확인 (product_code 기준)
      const { data: existing } = await supabase
        .from('ru_products')
        .select('id')
        .eq('product_code', product.product_code)
        .single()

      const productData = {
        product_code: product.product_code,
        name_ko: product.name_ko,
        name_en: product.name_en || null,
        name_ru: product.name_ru || null,
        barcode: product.barcode || null,
        brand: product.brand || null,
        category: product.category || null,
        volume: product.volume || null,
        pcs_per_carton: product.pcs_per_carton || 1,
        remarks: product.remarks || null,
        status: 'active',
      }

      if (existing) {
        // 업데이트
        const { error } = await supabase
          .from('ru_products')
          .update(productData)
          .eq('id', existing.id)

        if (error) {
          errors.push(`${product.product_code}: ${error.message}`)
        } else {
          updated++
        }
      } else {
        // 신규 삽입
        const { error } = await supabase
          .from('ru_products')
          .insert(productData)

        if (error) {
          errors.push(`${product.product_code}: ${error.message}`)
        } else {
          inserted++
        }
      }

      // 가격 정보가 있으면 ru_prices에도 저장
      if (product.base_price_krw > 0) {
        // 기존 가격 확인
        const { data: existingPrice } = await supabase
          .from('ru_prices')
          .select('id')
          .eq('product_code', product.product_code)
          .order('effective_date', { ascending: false })
          .limit(1)
          .single()

        const priceData = {
          product_code: product.product_code,
          base_price: product.base_price_krw,
          commission: 0,
          final_price: product.base_price_krw,
          effective_date: new Date().toISOString().split('T')[0]
        }

        if (existingPrice) {
          await supabase
            .from('ru_prices')
            .update(priceData)
            .eq('id', existingPrice.id)
        } else {
          await supabase
            .from('ru_prices')
            .insert(priceData)
        }
      }
    }

    return NextResponse.json({
      success: true,
      inserted,
      updated,
      total: products.length,
      errors: errors.length > 0 ? errors : undefined
    })

  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '임포트 처리 중 오류 발생' },
      { status: 500 }
    )
  }
}
