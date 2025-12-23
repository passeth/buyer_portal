import { createAdminClient } from '@/lib/supabase/admin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

async function getDashboardStats() {
  const supabase = createAdminClient()

  const [
    { count: productCount },
    { count: orderCount },
    { data: recentOrders },
    { data: statusCounts }
  ] = await Promise.all([
    supabase.from('ru_products').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('ru_orders').select('*', { count: 'exact', head: true }),
    supabase
      .from('ru_orders')
      .select('id, order_number, status, order_date, total_amount, buyer_name')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase.from('ru_orders').select('status')
  ])

  const ordersByStatus = (statusCounts || []).reduce((acc, { status }) => {
    acc[status] = (acc[status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return {
    productCount: productCount || 0,
    orderCount: orderCount || 0,
    recentOrders: recentOrders || [],
    ordersByStatus
  }
}

const statusLabels: Record<string, { label: string; color: string }> = {
  DRAFT: { label: '작성 중', color: 'bg-gray-100 text-gray-700' },
  CONFIRMED: { label: '확정', color: 'bg-green-100 text-green-700' },
  PACKING: { label: '패킹', color: 'bg-purple-100 text-purple-700' },
  SHIPPED: { label: '출하', color: 'bg-cyan-100 text-cyan-700' },
  COMPLETED: { label: '완료', color: 'bg-emerald-100 text-emerald-700' },
  CANCELLED: { label: '취소', color: 'bg-red-100 text-red-700' },
}

export default async function DashboardPage() {
  const stats = await getDashboardStats()

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      month: '2-digit',
      day: '2-digit'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
      maximumFractionDigits: 0
    }).format(amount)
  }

  const inProgressCount = (stats.ordersByStatus['CONFIRMED'] || 0) + (stats.ordersByStatus['PACKING'] || 0)

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">대시보드</h1>
        <p className="text-muted-foreground mt-2">
          RUboard - 러시아 발주 관리 플랫폼
        </p>
      </div>

      {/* 주요 지표 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              등록 제품
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.productCount}</div>
            <Link href="/products" className="text-sm text-primary hover:underline">
              제품 관리
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              전체 발주
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.orderCount}</div>
            <Link href="/orders" className="text-sm text-primary hover:underline">
              발주 관리
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              진행 중
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">{inProgressCount}</div>
            <span className="text-sm text-muted-foreground">확정/패킹</span>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              출하 완료
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {stats.ordersByStatus['SHIPPED'] || 0}
            </div>
            <span className="text-sm text-muted-foreground">이번 달</span>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* 최근 발주 */}
        <Card>
          <CardHeader>
            <CardTitle>최근 발주</CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recentOrders.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                발주 내역이 없습니다.
              </div>
            ) : (
              <div className="space-y-4">
                {stats.recentOrders.map((order) => {
                  const status = statusLabels[order.status as string]
                  return (
                    <Link
                      key={order.id}
                      href={`/orders/${order.id}`}
                      className="block p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-mono font-medium">{order.order_number}</div>
                          <div className="text-sm text-muted-foreground">
                            {order.buyer_name} | {formatDate(order.order_date)}
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className={status?.color}>{status?.label}</Badge>
                          <div className="text-sm font-medium mt-1">
                            {formatCurrency(order.total_amount || 0)}
                          </div>
                        </div>
                      </div>
                    </Link>
                  )
                })}
              </div>
            )}
            <div className="mt-4 pt-4 border-t">
              <Link href="/orders" className="text-sm text-primary hover:underline">
                전체 발주 보기
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* 상태별 현황 */}
        <Card>
          <CardHeader>
            <CardTitle>발주 상태 현황</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(statusLabels).map(([key, { label, color }]) => {
                const count = stats.ordersByStatus[key] || 0
                return (
                  <div key={key} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Badge className={color}>{label}</Badge>
                    </div>
                    <div className="font-medium">{count}건</div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 빠른 액션 */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold mb-4">빠른 액션</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Link
            href="/orders/new"
            className="p-4 border rounded-lg hover:bg-muted/50 transition-colors text-center"
          >
            <div className="text-2xl mb-2">+</div>
            <div className="font-medium">새 발주서</div>
          </Link>
          <Link
            href="/products"
            className="p-4 border rounded-lg hover:bg-muted/50 transition-colors text-center"
          >
            <div className="text-2xl mb-2">P</div>
            <div className="font-medium">제품 관리</div>
          </Link>
          <Link
            href="/inventory"
            className="p-4 border rounded-lg hover:bg-muted/50 transition-colors text-center"
          >
            <div className="text-2xl mb-2">I</div>
            <div className="font-medium">재고 관리</div>
          </Link>
          <Link
            href="/orders"
            className="p-4 border rounded-lg hover:bg-muted/50 transition-colors text-center"
          >
            <div className="text-2xl mb-2">O</div>
            <div className="font-medium">발주 목록</div>
          </Link>
        </div>
      </div>
    </div>
  )
}
