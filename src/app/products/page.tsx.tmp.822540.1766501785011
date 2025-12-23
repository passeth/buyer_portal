import { createAdminClient } from '@/lib/supabase/admin'
import { ProductsTable } from '@/components/products/ProductsTable'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const dynamic = 'force-dynamic'

async function getProductsWithPrices() {
  const supabase = createAdminClient()

  // 제품 조회
  const { data: products, error: productsError } = await supabase
    .from('ru_products')
    .select('*')
    .order('product_code', { ascending: true })

  if (productsError) {
    console.error('Error fetching products:', productsError)
    return []
  }

  if (!products || products.length === 0) {
    return []
  }

  // 가격 조회 (최신 가격만)
  const { data: prices } = await supabase
    .from('ru_prices')
    .select('*')
    .order('effective_date', { ascending: false })

  // 제품별 최신 가격 매핑
  const priceMap = new Map<string, NonNullable<typeof prices>[number]>()
  prices?.forEach(price => {
    if (!priceMap.has(price.product_code)) {
      priceMap.set(price.product_code, price)
    }
  })

  // 제품에 가격 정보 추가
  return products.map(product => ({
    ...product,
    price: priceMap.get(product.product_code) || undefined
  }))
}

// 브랜드 목록 추출 (제품 테이블에서 DISTINCT)
async function getBrands() {
  const supabase = createAdminClient()

  const { data } = await supabase
    .from('ru_products')
    .select('brand')
    .not('brand', 'is', null)
    .order('brand', { ascending: true })

  // 중복 제거
  const uniqueBrands = [...new Set(data?.map(d => d.brand).filter(Boolean))]
  return uniqueBrands
}

// 통계
async function getStats() {
  const supabase = createAdminClient()

  const { data: products } = await supabase
    .from('ru_products')
    .select('status, brand')

  const total = products?.length || 0
  const active = products?.filter(p => p.status === 'active').length || 0
  const inactive = products?.filter(p => p.status === 'inactive').length || 0
  const brands = new Set(products?.map(p => p.brand).filter(Boolean)).size

  return { total, active, inactive, brands }
}

export default async function ProductsPage() {
  const [products, brands, stats] = await Promise.all([
    getProductsWithPrices(),
    getBrands(),
    getStats()
  ])

  return (
    <div className="container mx-auto py-8 px-4">
      {/* 헤더 */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold">제품 마스터</h1>
        <p className="text-muted-foreground mt-1">러시아 수출용 제품 관리</p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              전체 제품
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              활성 제품
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              비활성 제품
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-400">{stats.inactive}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              브랜드 수
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.brands}</div>
          </CardContent>
        </Card>
      </div>

      {/* 제품 테이블 */}
      <Card>
        <CardHeader>
          <CardTitle>제품 목록</CardTitle>
        </CardHeader>
        <CardContent>
          <ProductsTable products={products} brands={brands as string[]} />
        </CardContent>
      </Card>
    </div>
  )
}
