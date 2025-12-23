import { createAdminClient } from '@/lib/supabase/admin'
import { OrdersTable } from '@/components/orders/OrdersTable'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

async function getOrdersWithPackingInfo() {
  const supabase = createAdminClient()

  // 발주 목록 조회
  const { data: orders, error } = await supabase
    .from('ru_orders')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) {
    console.error('Error fetching orders:', error)
    return []
  }

  if (!orders || orders.length === 0) {
    return []
  }

  // 패킹리스트 정보 조회
  const orderIds = orders.map(o => o.id)
  const { data: packingLists } = await supabase
    .from('ru_packing_lists')
    .select('order_id, pl_number')
    .in('order_id', orderIds)

  // 발주별 목적지 정보 조회
  const { data: orderItems } = await supabase
    .from('ru_order_items')
    .select('order_id, destination')
    .in('order_id', orderIds)

  // 패킹리스트 맵 생성
  const packingMap = new Map<string, string[]>()
  packingLists?.forEach(pl => {
    const existing = packingMap.get(pl.order_id) || []
    packingMap.set(pl.order_id, [...existing, pl.pl_number])
  })

  // 목적지 맵 생성 (유니크한 목적지들)
  const destinationMap = new Map<string, Set<string>>()
  orderItems?.forEach(item => {
    if (item.destination) {
      const existing = destinationMap.get(item.order_id) || new Set()
      existing.add(item.destination)
      destinationMap.set(item.order_id, existing)
    }
  })

  // 발주에 패킹리스트 정보 추가
  return orders.map(order => ({
    ...order,
    packing_lists: packingMap.get(order.id) || [],
    destinations: Array.from(destinationMap.get(order.id) || [])
  }))
}

export default async function OrdersPage() {
  const orders = await getOrdersWithPackingInfo()

  // 상태별 카운트
  const statusCounts = orders.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">발주 관리</h1>
        <Link href="/orders/new">
          <Button>새 발주서 작성</Button>
        </Link>
      </div>

      {/* 상태별 요약 */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{orders.length}</div>
            <div className="text-sm text-muted-foreground">전체</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-gray-600">
              {statusCounts['DRAFT'] || 0}
            </div>
            <div className="text-sm text-muted-foreground">작성 중</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-600">
              {statusCounts['CONFIRMED'] || 0}
            </div>
            <div className="text-sm text-muted-foreground">확정</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-purple-600">
              {statusCounts['PACKING'] || 0}
            </div>
            <div className="text-sm text-muted-foreground">패킹</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-cyan-600">
              {statusCounts['SHIPPED'] || 0}
            </div>
            <div className="text-sm text-muted-foreground">출하</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-emerald-600">
              {statusCounts['COMPLETED'] || 0}
            </div>
            <div className="text-sm text-muted-foreground">완료</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>발주 목록</CardTitle>
        </CardHeader>
        <CardContent>
          <OrdersTable orders={orders} />
        </CardContent>
      </Card>
    </div>
  )
}
