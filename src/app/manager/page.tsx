import { createAdminClient } from '@/lib/supabase/admin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import Link from 'next/link'

// 상태별 설정
const statusConfig: Record<string, { label: string; color: string }> = {
  DRAFT: { label: '작성중', color: 'bg-gray-100 text-gray-800' },
  CONFIRMED: { label: '확정', color: 'bg-blue-100 text-blue-800' },
  PACKING: { label: '패킹중', color: 'bg-yellow-100 text-yellow-800' },
  SHIPPED: { label: '출고완료', color: 'bg-purple-100 text-purple-800' },
  COMPLETED: { label: '완료', color: 'bg-green-100 text-green-800' },
  CANCELLED: { label: '취소', color: 'bg-red-100 text-red-800' },
}

async function getOrderStats() {
  const supabase = createAdminClient()

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

async function getActiveOrdersWithDetails() {
  const supabase = createAdminClient()

  const { data: orders } = await supabase
    .from('ru_orders')
    .select('*')
    .in('status', ['DRAFT', 'CONFIRMED', 'PACKING'])
    .order('created_at', { ascending: false })

  if (!orders || orders.length === 0) return []

  // 품목 상세 조회 (가격 정보 포함)
  const orderIds = orders.map(o => o.id)
  const { data: items } = await supabase
    .from('ru_order_items')
    .select('*')
    .in('order_id', orderIds)

  // 발주별 가격 합계 계산
  return orders.map(order => {
    const orderItems = items?.filter(item => item.order_id === order.id) || []

    const totals = orderItems.reduce((acc, item) => {
      const qty = item.confirmed_qty ?? item.requested_qty
      return {
        qty: acc.qty + qty,
        supplyTotal: acc.supplyTotal + (item.supply_price || 0) * qty,
        commissionTotal: acc.commissionTotal + (item.commission || 0) * qty,
        finalTotal: acc.finalTotal + (item.unit_price || 0) * qty,
      }
    }, { qty: 0, supplyTotal: 0, commissionTotal: 0, finalTotal: 0 })

    return {
      ...order,
      itemCount: orderItems.length,
      calculatedTotals: totals
    }
  })
}

async function getBuyerStats() {
  const supabase = createAdminClient()

  const { data: orders } = await supabase
    .from('ru_orders')
    .select('buyer_name, total_amount, status')
    .not('buyer_name', 'is', null)

  // 바이어별 통계
  const buyerMap = new Map<string, { orderCount: number; totalAmount: number; completedCount: number }>()

  orders?.forEach(order => {
    const buyerName = order.buyer_name || 'Unknown'
    const existing = buyerMap.get(buyerName) || { orderCount: 0, totalAmount: 0, completedCount: 0 }
    buyerMap.set(buyerName, {
      orderCount: existing.orderCount + 1,
      totalAmount: existing.totalAmount + (order.total_amount || 0),
      completedCount: existing.completedCount + (order.status === 'COMPLETED' ? 1 : 0)
    })
  })

  return Array.from(buyerMap.entries())
    .map(([name, stats]) => ({ name, ...stats }))
    .sort((a, b) => b.totalAmount - a.totalAmount)
    .slice(0, 10)
}

async function getProductStats() {
  const supabase = createAdminClient()

  const { data: items } = await supabase
    .from('ru_order_items')
    .select('product_code, product_name, requested_qty, confirmed_qty, unit_price')

  // 품목별 통계
  const productMap = new Map<string, { name: string; totalQty: number; totalAmount: number; orderCount: number }>()

  items?.forEach(item => {
    const code = item.product_code
    const qty = item.confirmed_qty ?? item.requested_qty
    const amount = qty * (item.unit_price || 0)
    const existing = productMap.get(code) || { name: item.product_name || code, totalQty: 0, totalAmount: 0, orderCount: 0 }
    productMap.set(code, {
      name: item.product_name || existing.name,
      totalQty: existing.totalQty + qty,
      totalAmount: existing.totalAmount + amount,
      orderCount: existing.orderCount + 1
    })
  })

  return Array.from(productMap.entries())
    .map(([code, stats]) => ({ code, ...stats }))
    .sort((a, b) => b.totalQty - a.totalQty)
    .slice(0, 15)
}

async function getRecentActivity() {
  const supabase = createAdminClient()

  // 최근 변경된 발주
  const { data: orders } = await supabase
    .from('ru_orders')
    .select('id, order_number, status, updated_at, destination')
    .order('updated_at', { ascending: false })
    .limit(10)

  return orders || []
}

export default async function ManagerDashboard() {
  const [stats, activeOrders, buyerStats, productStats, recentActivity] = await Promise.all([
    getOrderStats(),
    getActiveOrdersWithDetails(),
    getBuyerStats(),
    getProductStats(),
    getRecentActivity()
  ])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR').format(price)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const totalActive = stats.DRAFT + stats.CONFIRMED + stats.PACKING

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">매니저 대시보드</h1>
          <p className="text-muted-foreground">발주 관리 및 실적 모니터링</p>
        </div>
        <div className="flex gap-2">
          <Link href="/orders">
            <Button variant="outline">발주 관리</Button>
          </Link>
          <Link href="/products">
            <Button variant="outline">제품 관리</Button>
          </Link>
        </div>
      </div>

      {/* 상태별 발주 현황 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {Object.entries(stats).map(([status, count]) => {
          const config = statusConfig[status] || statusConfig.DRAFT
          return (
            <Card key={status} className={count > 0 ? 'border-2' : ''}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {config.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold">{count}</span>
                  <Badge className={config.color}>{status}</Badge>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* 처리 필요 알림 */}
      {totalActive > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-3xl font-bold text-blue-600">{totalActive}</span>
                <span className="text-blue-800">건의 발주가 처리 대기 중입니다</span>
              </div>
              <Link href="/orders?status=active">
                <Button>처리하기 →</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 진행 중 발주 상세 */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>진행 중인 발주 (가격 상세)</span>
                <Link href="/orders">
                  <Button variant="ghost" size="sm">전체 보기 →</Button>
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activeOrders.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  진행 중인 발주가 없습니다.
                </div>
              ) : (
                <div className="overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>발주번호</TableHead>
                        <TableHead>목적지</TableHead>
                        <TableHead className="text-center">상태</TableHead>
                        <TableHead className="text-right">본사가</TableHead>
                        <TableHead className="text-right">커미션</TableHead>
                        <TableHead className="text-right">최종가</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {activeOrders.map(order => {
                        const config = statusConfig[order.status] || statusConfig.DRAFT
                        const totals = order.calculatedTotals
                        return (
                          <TableRow key={order.id}>
                            <TableCell>
                              <Link href={`/orders/${order.id}`} className="font-mono hover:underline">
                                {order.order_number}
                              </Link>
                              <div className="text-xs text-muted-foreground">
                                {order.itemCount}개 품목
                              </div>
                            </TableCell>
                            <TableCell>{order.destination || '-'}</TableCell>
                            <TableCell className="text-center">
                              <Badge className={config.color}>{config.label}</Badge>
                            </TableCell>
                            <TableCell className="text-right text-sm">
                              ₩{formatPrice(totals.supplyTotal)}
                            </TableCell>
                            <TableCell className="text-right text-sm text-orange-600">
                              ₩{formatPrice(totals.commissionTotal)}
                            </TableCell>
                            <TableCell className="text-right font-medium">
                              ₩{formatPrice(totals.finalTotal)}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                      {/* 합계 */}
                      <TableRow className="bg-muted/50 font-medium">
                        <TableCell colSpan={3}>합계</TableCell>
                        <TableCell className="text-right">
                          ₩{formatPrice(activeOrders.reduce((sum, o) => sum + o.calculatedTotals.supplyTotal, 0))}
                        </TableCell>
                        <TableCell className="text-right text-orange-600">
                          ₩{formatPrice(activeOrders.reduce((sum, o) => sum + o.calculatedTotals.commissionTotal, 0))}
                        </TableCell>
                        <TableCell className="text-right">
                          ₩{formatPrice(activeOrders.reduce((sum, o) => sum + o.calculatedTotals.finalTotal, 0))}
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 사이드바 */}
        <div className="space-y-6">
          {/* 최근 활동 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">최근 활동</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {recentActivity.map(order => {
                  const config = statusConfig[order.status] || statusConfig.DRAFT
                  return (
                    <Link key={order.id} href={`/orders/${order.id}`}>
                      <div className="p-2 border rounded hover:bg-muted/50 transition-colors">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-sm">{order.order_number}</span>
                          <Badge className={config.color} variant="outline">
                            {config.label}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {formatDate(order.updated_at)}
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 하단 통계 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 바이어별 실적 */}
        <Card>
          <CardHeader>
            <CardTitle>바이어별 발주 실적</CardTitle>
          </CardHeader>
          <CardContent>
            {buyerStats.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                발주 데이터가 없습니다.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>바이어</TableHead>
                    <TableHead className="text-center">발주</TableHead>
                    <TableHead className="text-center">완료</TableHead>
                    <TableHead className="text-right">총액</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {buyerStats.map(buyer => (
                    <TableRow key={buyer.name}>
                      <TableCell className="font-medium">{buyer.name}</TableCell>
                      <TableCell className="text-center">{buyer.orderCount}건</TableCell>
                      <TableCell className="text-center text-green-600">{buyer.completedCount}건</TableCell>
                      <TableCell className="text-right">₩{formatPrice(buyer.totalAmount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        {/* 품목별 실적 */}
        <Card>
          <CardHeader>
            <CardTitle>품목별 발주 실적 (Top 15)</CardTitle>
          </CardHeader>
          <CardContent>
            {productStats.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                발주 데이터가 없습니다.
              </div>
            ) : (
              <div className="max-h-[400px] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>품목코드</TableHead>
                      <TableHead>품목명</TableHead>
                      <TableHead className="text-right">수량</TableHead>
                      <TableHead className="text-right">금액</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {productStats.map(product => (
                      <TableRow key={product.code}>
                        <TableCell className="font-mono text-sm">{product.code}</TableCell>
                        <TableCell className="text-sm truncate max-w-[150px]">{product.name}</TableCell>
                        <TableCell className="text-right">{product.totalQty.toLocaleString()}</TableCell>
                        <TableCell className="text-right">₩{formatPrice(product.totalAmount)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
