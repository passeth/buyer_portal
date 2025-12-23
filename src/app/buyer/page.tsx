import { createAdminClient } from '@/lib/supabase/admin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
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
    .select('status, total_amount')

  const stats = {
    total: orders?.length || 0,
    active: orders?.filter(o => ['DRAFT', 'CONFIRMED', 'PACKING'].includes(o.status)).length || 0,
    completed: orders?.filter(o => o.status === 'COMPLETED').length || 0,
    totalAmount: orders?.reduce((sum, o) => sum + (o.total_amount || 0), 0) || 0
  }

  return stats
}

async function getRecentOrders() {
  const supabase = createAdminClient()

  const { data: orders } = await supabase
    .from('ru_orders')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10)

  return orders || []
}

async function getActiveOrders() {
  const supabase = createAdminClient()

  const { data: orders } = await supabase
    .from('ru_orders')
    .select('*')
    .in('status', ['DRAFT', 'CONFIRMED', 'PACKING', 'SHIPPED'])
    .order('created_at', { ascending: false })

  // 각 발주의 품목 수 조회
  if (orders && orders.length > 0) {
    const orderIds = orders.map(o => o.id)
    const { data: items } = await supabase
      .from('ru_order_items')
      .select('order_id, id')
      .in('order_id', orderIds)

    const itemCounts = new Map<string, number>()
    items?.forEach(item => {
      const count = itemCounts.get(item.order_id) || 0
      itemCounts.set(item.order_id, count + 1)
    })

    return orders.map(order => ({
      ...order,
      itemCount: itemCounts.get(order.id) || 0
    }))
  }

  return orders || []
}

async function getPackingLists() {
  const supabase = createAdminClient()

  const { data: packingLists } = await supabase
    .from('ru_packing_lists')
    .select('pl_number, order_id, created_date, total_qty, total_cartons')
    .order('created_date', { ascending: false })
    .limit(5)

  return packingLists || []
}

export default async function BuyerDashboard() {
  const [stats, recentOrders, activeOrders, packingLists] = await Promise.all([
    getOrderStats(),
    getRecentOrders(),
    getActiveOrders(),
    getPackingLists()
  ])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR').format(price)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">바이어 대시보드</h1>
          <p className="text-muted-foreground">발주 현황 및 진행 상태 확인</p>
        </div>
        <Link href="/orders/new">
          <Button size="lg">+ 새 발주서 작성</Button>
        </Link>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              전체 발주
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}건</div>
          </CardContent>
        </Card>
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">
              진행 중
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.active}건</div>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-800">
              완료
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.completed}건</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              총 발주액
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₩{formatPrice(stats.totalAmount)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 진행 중인 발주 */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>진행 중인 발주</span>
                <Link href="/orders">
                  <Button variant="ghost" size="sm">전체 보기 →</Button>
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activeOrders.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  진행 중인 발주가 없습니다.
                  <div className="mt-4">
                    <Link href="/orders/new">
                      <Button>첫 발주 작성하기</Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {activeOrders.map(order => {
                    const config = statusConfig[order.status] || statusConfig.DRAFT
                    return (
                      <Link key={order.id} href={`/orders/${order.id}`}>
                        <div className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                          <div className="flex items-center gap-4">
                            <div>
                              <div className="font-mono font-medium">{order.order_number}</div>
                              <div className="text-sm text-muted-foreground">
                                {order.destination} · {order.itemCount || 0}개 품목
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <div className="font-medium">₩{formatPrice(order.total_amount || 0)}</div>
                              <div className="text-xs text-muted-foreground">
                                {formatDate(order.created_at)}
                              </div>
                            </div>
                            <Badge className={config.color}>
                              {config.label}
                            </Badge>
                          </div>
                        </div>
                      </Link>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 사이드바 - 최근 패킹리스트 */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">최근 패킹리스트</CardTitle>
            </CardHeader>
            <CardContent>
              {packingLists.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-4">
                  패킹리스트가 없습니다.
                </div>
              ) : (
                <div className="space-y-2">
                  {packingLists.map(pl => (
                    <Link key={pl.pl_number} href={`/packing/${pl.pl_number}`}>
                      <div className="p-3 border rounded hover:bg-muted/50 transition-colors">
                        <div className="font-mono text-sm">{pl.pl_number}</div>
                        <div className="flex justify-between text-xs text-muted-foreground mt-1">
                          <span>{pl.total_qty?.toLocaleString()}개 / {pl.total_cartons}CTN</span>
                          <span>{formatDate(pl.created_date)}</span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 빠른 링크 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">빠른 메뉴</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Link href="/orders/new" className="block">
                <Button variant="outline" className="w-full justify-start">
                  📝 새 발주서 작성
                </Button>
              </Link>
              <Link href="/orders" className="block">
                <Button variant="outline" className="w-full justify-start">
                  📋 발주 내역 조회
                </Button>
              </Link>
              <Link href="/products" className="block">
                <Button variant="outline" className="w-full justify-start">
                  📦 제품 목록 보기
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 최근 발주 내역 */}
      <Card>
        <CardHeader>
          <CardTitle>최근 발주 내역</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b text-sm text-muted-foreground">
                  <th className="text-left py-3 px-2">발주번호</th>
                  <th className="text-left py-3 px-2">목적지</th>
                  <th className="text-center py-3 px-2">상태</th>
                  <th className="text-right py-3 px-2">수량</th>
                  <th className="text-right py-3 px-2">금액</th>
                  <th className="text-right py-3 px-2">발주일</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map(order => {
                  const config = statusConfig[order.status] || statusConfig.DRAFT
                  return (
                    <tr key={order.id} className="border-b hover:bg-muted/30">
                      <td className="py-3 px-2">
                        <Link href={`/orders/${order.id}`} className="font-mono hover:underline">
                          {order.order_number}
                        </Link>
                      </td>
                      <td className="py-3 px-2">{order.destination || '-'}</td>
                      <td className="py-3 px-2 text-center">
                        <Badge className={config.color}>{config.label}</Badge>
                      </td>
                      <td className="py-3 px-2 text-right">{order.total_qty?.toLocaleString() || 0}</td>
                      <td className="py-3 px-2 text-right font-medium">
                        ₩{formatPrice(order.total_amount || 0)}
                      </td>
                      <td className="py-3 px-2 text-right text-muted-foreground">
                        {formatDate(order.created_at)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
