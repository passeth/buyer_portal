import { createAdminClient } from '@/lib/supabase/admin'
import { ProductForm } from '@/components/products/ProductForm'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

async function getBrands() {
  const supabase = createAdminClient()

  const { data } = await supabase
    .from('ru_products')
    .select('brand')
    .not('brand', 'is', null)
    .order('brand', { ascending: true })

  const uniqueBrands = [...new Set(data?.map(d => d.brand).filter(Boolean))]
  return uniqueBrands as string[]
}

export default async function NewProductPage() {
  const brands = await getBrands()

  return (
    <div className="container mx-auto py-8 px-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">신제품 등록</h1>
          <p className="text-muted-foreground mt-1">새로운 제품을 등록합니다</p>
        </div>
        <Link href="/products">
          <Button variant="outline">← 목록으로</Button>
        </Link>
      </div>

      {/* 폼 */}
      <ProductForm brands={brands} mode="create" />
    </div>
  )
}
