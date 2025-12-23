import { notFound, redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { OrderForm } from '@/components/orders/OrderForm'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: Promise<{ id: string }>
}

async function getOrder(id: string) {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('ru_orders')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching order:', error)
    return null
  }

  return data
}

async function getOrderItems(orderId: string) {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('ru_order_items')
    .select('*')
    .eq('order_id', orderId)
    .order('product_code', { ascending: true })

  if (error) {
    console.error('Error fetching order items:', error)
    return []
  }

  return data || []
}

async function getProducts() {
  const supabase = createAdminClient()

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

  return products.map(product => ({
    ...product,
    price: priceMap.get(product.product_code) || null
  }))
}

export default async function EditOrderPage({ params }: PageProps) {
  const { id } = await params
  const [order, items, products] = await Promise.all([
    getOrder(id),
    getOrderItems(id),
    getProducts()
  ])

  if (!order) {
    notFound()
  }

  // DRAFT 상태만 수정 가능
  if (order.status !== 'DRAFT') {
    redirect(`/orders/${id}`)
  }

  // OrderForm에 맞는 형식으로 변환
  const initialData = {
    id: order.id,
    destination: order.destination || '',
    remarks: order.remarks || '',
    items: items.map(item => ({
      product_code: item.product_code,
      product_name: item.product_name || '',
      qty: item.requested_qty,
      cartons: item.pcs_per_ctn && item.pcs_per_ctn > 0
        ? Math.ceil(item.requested_qty / item.pcs_per_ctn)
        : 1,
      pcs_per_carton: item.pcs_per_ctn || 1,
      supply_price: item.supply_price || 0,
      commission: item.commission || 0,
      unit_price: item.unit_price || 0
    }))
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">발주서 수정</h1>
          <p className="text-muted-foreground mt-2">
            발주번호: <span className="font-mono font-medium">{order.order_number}</span>
          </p>
        </div>
        <Link href={`/orders/${id}`}>
          <Button variant="outline">← 상세로 돌아가기</Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>발주서 정보</CardTitle>
        </CardHeader>
        <CardContent>
          <OrderForm products={products} initialData={initialData} />
        </CardContent>
      </Card>
    </div>
  )
}
