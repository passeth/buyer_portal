import { createAdminClient } from '@/lib/supabase/admin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { SupplierOrderList } from '@/components/supplier/SupplierOrderList'
import { InventoryMonitor } from '@/components/supplier/InventoryMonitor'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

// 상태별 색상
const statusColors: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-800',
  CONFIRMED: 'bg-blue-100 text-blue-800',
  PACKING: 'bg-yellow-100 text-yellow-800',
  SHIPPED: 'bg-purple-100 text-purple-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
}

const statusLabels: Record<string, string> = {
  DRAFT: '작성중',
  CONFIRMED: '확정',
  PACKING: '패킹중',
  SHIPPED: '출고완료',
  COMPLETED: '완료',
  CANCELLED: '취소',
}

async function getOrderStats() {
  const supabase = createAdminClient()

  // 상태별 발주 수
  const { data: orders } = await supabase
    .from('ru_orders')
    .select('status')

  const stats: Record<string, number> = {
    DRAFT: 0,
    CONFIRMED: 0,
    PACKING: 0,
    SHIPPED: 0,
    COMPLETED: 0,
    CANCELLED: 0,
  }

  orders?.forEach(order => {
    if (stats[order.status] !== undefined) {
      stats[order.status]++
    }
  })

  return stats
}

async function getRecentOrders() {
  const supabase = createAdminClient()

  const { data: orders } = await supabase
    .from('ru_orders')
    .select('*')
    .in('status', ['DRAFT', 'CONFIRMED', 'PACKING'])
    .order('created_at', { ascending: false })
    .limit(20)

  // 각 발주의 품목 조회
  if (orders && orders.length > 0) {
    const orderIds = orders.map(o => o.id)
    const { data: items } = await supabase
      .from('ru_order_items')
      .select('*')
      .in('order_id', orderIds)

    // 품목을 발주에 연결
    return orders.map(order => ({
      ...order,
      items: items?.filter(item => item.order_id === order.id) || []
    }))
  }

  return orders || []
}

// ru_products에 등록된 품목만 재고 부족 조회
async function getLowStockItems() {
  const supabase = createAdminClient()

  // ru_products의 품목 코드 조회
  const { data: ruProducts } = await supabase
    .from('ru_products')
    .select('product_code, name_ko')
    .eq('status', 'active')

  if (!ruProducts || ruProducts.length === 0) {
    return []
  }

  const productCodes = ruProducts.map(p => p.product_code)
  const productMap = new Map(ruProducts.map(p => [p.product_code, p.name_ko]))

  // cm_erp_products에서 재고 부족 품목 (ru_products에 등록된 품목만)
  const { data: lowStock } = await supabase
    .from('cm_erp_products')
    .select('product_id, name, bal_qty')
    .in('product_id', productCodes)
    .lt('bal_qty', 100)
    .gt('bal_qty', 0)
    .order('bal_qty', { ascending: true })
    .limit(10)

  return (lowStock || []).map(item => ({
    product_id: item.product_id,
    name: productMap.get(item.product_id) || item.name,
    bal_qty: item.bal_qty
  }))
}

// ru_products에 등록된 품목만 유통기한 임박 LOT 조회
async function getExpiringLots() {
  const supabase = createAdminClient()

  // ru_products의 품목 코드 조회
  const { data: ruProducts } = await supabase
    .from('ru_products')
    .select('product_code')
    .eq('status', 'active')

  if (!ruProducts || ruProducts.length === 0) {
    return []
  }

  const productCodes = ruProducts.map(p => p.product_code)

  // 유통기한 임박 LOT (3개월 내) - ru_products에 등록된 품목만
  const { data: expiring } = await supabase
    .from('cm_lots_expiring_soon')
    .select('*')
    .in('product_id', productCodes)
    .limit(10)

  return expiring || []
}

// 발주별 총액 (3가지 가격 모두)
async function getOrderAmounts() {
  const supabase = createAdminClient()

  const { data: orders } = await supabase
    .from('ru_orders')
    .select('id, order_number, status, destination')
    .in('status', ['CONFIRMED', 'PACKING'])

  if (!orders || orders.length === 0) {
    return []
  }

  const orderIds = orders.map(o => o.id)
  const { data: items } = await supabase
    .from('ru_order_items')
    .select('order_id, requested_qty, confirmed_qty, supply_price, commission, unit_price')
    .in('order_id', orderIds)

  return orders.map(order => {
    const orderItems = items?.filter(item => item.order_id === order.id) || []

    const totals = orderItems.reduce((acc, item) => {
      const qty = item.confirmed_qty ?? item.requested_qty
      return {
        supplyTotal: acc.supplyTotal + (item.supply_price || 0) * qty,
        commissionTotal: acc.commissionTotal + (item.commission || 0) * qty,
        finalTotal: acc.finalTotal + (item.unit_price || 0) * qty,
      }
    }, { supplyTotal: 0, commissionTotal: 0, finalTotal: 0 })

    return {
      ...order,
      ...totals
    }
  })
}

export default async function SupplierDashboard() {
  const [stats, orders, lowStock, expiringLots, orderAmounts] = await Promise.all([
    getOrderStats(),
    getRecentOrders(),
    getLowStockItems(),
    getExpiringLots(),
    getOrderAmounts()
  ])

  const activeOrders = stats.DRAFT + stats.CONFIRMED + stats.PACKING

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR').format(price)
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">에바스 대시보드</h1>
          <p className="text-muted-foreground">발주 현황 및 재고 모니터링</p>
        </div>
        <div className="flex gap-2">
          <Link href="/inventory">
            <Button variant="outline">재고 현황</Button>
          </Link>
          <Link href="/packing">
            <Button variant="outline">패킹리스트</Button>
          </Link>
        </div>
      </div>

      {/* 상태별 요약 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {Object.entries(stats).map(([status, count]) => (
          <Card key={status} className={count > 0 ? 'border-2' : ''}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {statusLabels[status]}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold">{count}</span>
                <span className={`px-2 py-1 rounded text-xs ${statusColors[status]}`}>
                  {status}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 주요 알림 */}
      {(activeOrders > 0 || lowStock.length > 0 || expiringLots.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 처리 대기 발주 */}
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-blue-800">처리 대기 발주</CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-3xl font-bold text-blue-600">{activeOrders}</span>
              <span className="text-blue-600 ml-2">건</span>
            </CardContent>
          </Card>

          {/* 재고 부족 품목 */}
          <Card className={lowStock.length > 0 ? 'border-orange-200 bg-orange-50' : ''}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-orange-800">재고 부족 품목</CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-3xl font-bold text-orange-600">{lowStock.length}</span>
              <span className="text-orange-600 ml-2">품목</span>
              <p className="text-xs text-orange-600 mt-1">(ru_products 등록 품목 기준)</p>
            </CardContent>
          </Card>

          {/* 유통기한 임박 */}
          <Card className={expiringLots.length > 0 ? 'border-red-200 bg-red-50' : ''}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-red-800">유통기한 임박 (3개월)</CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-3xl font-bold text-red-600">{expiringLots.length}</span>
              <span className="text-red-600 ml-2">LOT</span>
              <p className="text-xs text-red-600 mt-1">(ru_products 등록 품목 기준)</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 발주별 금액 요약 */}
      {orderAmounts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>진행 중 발주 금액 (CONFIRMED + PACKING)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-sm text-muted-foreground">
                    <th className="text-left py-2 px-2">발주번호</th>
                    <th className="text-left py-2 px-2">목적지</th>
                    <th className="text-center py-2 px-2">상태</th>
                    <th className="text-right py-2 px-2">본사가</th>
                    <th className="text-right py-2 px-2">커미션</th>
                    <th className="text-right py-2 px-2">최종가</th>
                    <th className="text-center py-2 px-2">액션</th>
                  </tr>
                </thead>
                <tbody>
                  {orderAmounts.map(order => (
                    <tr key={order.id} className="border-b hover:bg-muted/30">
                      <td className="py-2 px-2">
                        <Link href={`/orders/${order.id}`} className="font-mono hover:underline">
                          {order.order_number}
                        </Link>
                      </td>
                      <td className="py-2 px-2">{order.destination || '-'}</td>
                      <td className="py-2 px-2 text-center">
                        <span className={`px-2 py-1 rounded text-xs ${statusColors[order.status]}`}>
                          {statusLabels[order.status]}
                        </span>
                      </td>
                      <td className="py-2 px-2 text-right">₩{formatPrice(order.supplyTotal)}</td>
                      <td className="py-2 px-2 text-right text-orange-600">₩{formatPrice(order.commissionTotal)}</td>
                      <td className="py-2 px-2 text-right font-medium">₩{formatPrice(order.finalTotal)}</td>
                      <td className="py-2 px-2 text-center">
                        <Link href={`/supplier/orders/${order.id}`}>
                          <Button variant="ghost" size="sm">컨펌</Button>
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {/* 합계 */}
                  <tr className="bg-muted/50 font-medium">
                    <td colSpan={3} className="py-2 px-2">합계</td>
                    <td className="py-2 px-2 text-right font-bold">
                      ₩{formatPrice(orderAmounts.reduce((sum, o) => sum + o.supplyTotal, 0))}
                    </td>
                    <td className="py-2 px-2 text-right text-orange-600">
                      ₩{formatPrice(orderAmounts.reduce((sum, o) => sum + o.commissionTotal, 0))}
                    </td>
                    <td className="py-2 px-2 text-right font-bold">
                      ₩{formatPrice(orderAmounts.reduce((sum, o) => sum + o.finalTotal, 0))}
                    </td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 메인 컨텐츠 - 2열 레이아웃 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 발주 목록 (2/3) */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>진행 중 발주 ({orders.length}건)</CardTitle>
            </CardHeader>
            <CardContent>
              <SupplierOrderList orders={orders} />
            </CardContent>
          </Card>
        </div>

        {/* 재고/LOT 모니터링 (1/3) */}
        <div className="space-y-6">
          <InventoryMonitor lowStock={lowStock} expiringLots={expiringLots} />
        </div>
      </div>
    </div>
  )
}
