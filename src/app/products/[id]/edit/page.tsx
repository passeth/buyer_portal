import { createAdminClient } from '@/lib/supabase/admin'
import { ProductForm } from '@/components/products/ProductForm'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { notFound } from 'next/navigation'

interface PageProps {
  params: Promise<{ id: string }>
}

async function getProduct(id: string) {
  const supabase = createAdminClient()

  const { data: product, error } = await supabase
    .from('ru_products')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !product) {
    return null
  }

  // 가격 조회
  const { data: price } = await supabase
    .from('ru_prices')
    .select('*')
    .eq('product_code', product.product_code)
    .order('effective_date', { ascending: false })
    .limit(1)
    .single()

  return {
    ...product,
    price: price || undefined
  }
}

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

export default async function EditProductPage({ params }: PageProps) {
  const { id } = await params
  const [product, brands] = await Promise.all([
    getProduct(id),
    getBrands()
  ])

  if (!product) {
    notFound()
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">제품 수정</h1>
          <p className="text-muted-foreground mt-1">
            {product.product_code} - {product.name_ko}
          </p>
        </div>
        <Link href="/products">
          <Button variant="outline">← 목록으로</Button>
        </Link>
      </div>

      {/* 폼 */}
      <ProductForm product={product} brands={brands} mode="edit" />
    </div>
  )
}
