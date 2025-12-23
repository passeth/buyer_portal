import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AvailabilityEditorWrapper } from './AvailabilityEditorWrapper'
import { SupplierOrderActions } from './SupplierOrderActions'

export const dynamic = 'force-dynamic'

interface OrderItem {
  id: string
  order_id: string
  product_code: string
  product_name?: string
  destination?: string
  requested_qty: number
  confirmed_qty?: number
  unit_price?: number
  supply_price?: number
  commission?: number
  subtotal?: number
  availability_status?: 'pending' | 'available' | 'partial' | 'unavailable'
  availability_note?: string
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

async function getOrderItems(orderId: string): Promise<OrderItem[]> {
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

// 재고 정보 조회 (ru_products에 등록된 품목만)
async function getInventoryInfo(productCodes: string[]) {
  if (productCodes.length === 0) return new Map()

  const supabase = createAdminClient()

  const { data } = await supabase
    .from('cm_erp_products')
    .select('product_id, bal_qty')
    .in('product_id', productCodes)

  const inventoryMap = new Map<string, number>()
  data?.forEach(item => {
    inventoryMap.set(item.product_id, item.bal_qty || 0)
  })

  return inventoryMap
}

const statusLabels: Record<string, { label: string; color: string }> = {
  DRAFT: { label: '작성 중', color: 'bg-gray-100 text-gray-700' },
  CONFIRMED: { label: '확정', color: 'bg-green-100 text-green-700' },
  PACKING: { label: '패킹 중', color: 'bg-purple-100 text-purple-700' },
  SHIPPED: { label: '출하', color: 'bg-cyan-100 text-cyan-700' },
  COMPLETED: { label: '완료', color: 'bg-emerald-100 text-emerald-700' },
  CANCELLED: { label: '취소', color: 'bg-red-100 text-red-700' },
}

export default async function SupplierOrderConfirmPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const [order, items] = await Promise.all([
    getOrder(id),
    getOrderItems(id)
  ])

  if (!order) {
    notFound()
  }

  // 재고 정보 조회
  const productCodes = items.map(item => item.product_code)
  const inventoryMap = await getInventoryInfo(productCodes)

  const status = statusLabels[order.status] || { label: order.status, color: 'bg-gray-100' }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR').format(amount)
  }

  // 출고 상태별 통계
  const pendingCount = items.filter(item => !item.availability_status || item.availability_status === 'pending').length
  const availableCount = items.filter(item => item.availability_status === 'available').length
  const partialCount = items.filter(item => item.availability_status === 'partial').length
  const unavailableCount = items.filter(item => item.availability_status === 'unavailable').length

  // 품목에 재고 정보 추가
  const itemsWithInventory = items.map(item => ({
    ...item,
    currentStock: inventoryMap.get(item.product_code) || 0
  }))

  // 전체 확정 가능 여부 (pending이 없을 때)
  const allConfirmed = pendingCount === 0 && items.length > 0

  return (
    <div className="container mx-auto py-8 px-4">
      {/* 헤더 */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <h1 className="text-3xl font-bold font-mono">{order.order_number}</h1>
            <Badge className={status.color}>{status.label}</Badge>
          </div>
          <p className="text-muted-foreground">
            출고 가능 여부 컨펌 · {order.buyer_name || '바이어 미지정'} · 발주일: {formatDate(order.order_date)}
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/supplier">
            <Button variant="outline">← 대시보드</Button>
          </Link>
          <Link href={`/orders/${id}`}>
            <Button variant="outline">발주 상세</Button>
          </Link>
        </div>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{items.length}</div>
            <div className="text-sm text-muted-foreground">총 품목</div>
          </CardContent>
        </Card>
        <Card className="border-gray-300">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-gray-600">{pendingCount}</div>
            <div className="text-sm text-muted-foreground">확인대기</div>
          </CardContent>
        </Card>
        <Card className="border-green-300">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-600">{availableCount}</div>
            <div className="text-sm text-muted-foreground">출고가능</div>
          </CardContent>
        </Card>
        <Card className="border-orange-300">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-orange-600">{partialCount}</div>
            <div className="text-sm text-muted-foreground">일부가능</div>
          </CardContent>
        </Card>
        <Card className="border-red-300">
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-red-600">{unavailableCount}</div>
            <div className="text-sm text-muted-foreground">출고불가</div>
          </CardContent>
        </Card>
      </div>

      {/* 금액 요약 */}
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">발주 금액</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-muted-foreground">본사가 합계</div>
              <div className="text-xl font-bold">
                ₩{formatCurrency(items.reduce((sum, item) => sum + ((item.supply_price || 0) * (item.confirmed_qty ?? item.requested_qty)), 0))}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">커미션 합계</div>
              <div className="text-xl font-bold text-blue-600">
                ₩{formatCurrency(items.reduce((sum, item) => sum + ((item.commission || 0) * (item.confirmed_qty ?? item.requested_qty)), 0))}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">최종 금액</div>
              <div className="text-xl font-bold text-primary">
                ₩{formatCurrency(order.total_amount || 0)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 출고 가능 여부 에디터 */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>품목별 출고 가능 여부</CardTitle>
          <CardDescription>
            각 품목의 재고를 확인하고 출고 가능 여부를 설정하세요.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AvailabilityEditorWrapper
            orderId={id}
            items={itemsWithInventory}
          />
        </CardContent>
      </Card>

      {/* 상태 변경 액션 */}
      {order.status === 'CONFIRMED' && allConfirmed && (
        <Card className="border-purple-300 bg-purple-50">
          <CardHeader>
            <CardTitle className="text-purple-800">패킹 진행 준비 완료</CardTitle>
            <CardDescription>
              모든 품목의 출고 가능 여부가 확정되었습니다. 패킹 단계로 진행할 수 있습니다.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SupplierOrderActions orderId={id} currentStatus={order.status} />
          </CardContent>
        </Card>
      )}

      {/* 비고 */}
      {order.remarks && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>비고</CardTitle>
          </CardHeader>
          <CardContent>
            <div>{order.remarks}</div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
