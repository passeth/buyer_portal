import { createAdminClient } from '@/lib/supabase/admin'
import { OrderForm } from '@/components/orders/OrderForm'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export const dynamic = 'force-dynamic'

async function getProducts() {
  const supabase = createAdminClient()

  // 제품 조회
  const { data: products } = await supabase
    .from('ru_products')
    .select('*')
    .eq('status', 'active')
    .order('product_code', { ascending: true })

  if (!products || products.length === 0) {
    return []
  }

  // 현재 가격 조회
  const { data: prices } = await supabase
    .from('ru_current_prices')
    .select('*')

  // 가격 매핑
  const priceMap = new Map(
    (prices || []).map(p => [p.product_code, p])
  )

  // 제품에 가격 연결
  return products.map(product => ({
    ...product,
    price: priceMap.get(product.product_code) || null
  }))
}

export default async function NewOrderPage() {
  const products = await getProducts()

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">새 발주서 작성</h1>
        <p className="text-muted-foreground mt-2">
          목적지를 선택하고 제품을 추가하여 발주서를 작성합니다.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>발주서 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <OrderForm products={products} />
        </CardContent>
      </Card>
    </div>
  )
}
