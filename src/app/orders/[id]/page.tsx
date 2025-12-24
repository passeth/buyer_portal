import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { OrderActions } from './OrderActions'
import { DestinationQtyTable } from '@/components/orders/DestinationQtyTable'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export const dynamic = 'force-dynamic'

interface OrderItem {
  id: string
  order_id: string
  product_code: string
  product_name?: string
  destination?: string
  pcs_per_ctn?: number
  requested_qty: number
  confirmed_qty?: number
  supply_price?: number
  commission?: number
  unit_price?: number
  subtotal?: number
  availability_status?: string
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

async function getPackingLists(orderId: string) {
  const supabase = createAdminClient()

  const { data } = await supabase
    .from('ru_packing_lists')
    .select('pl_number, created_date, total_qty, total_cartons, total_amount')
    .eq('order_id', orderId)
    .order('created_date', { ascending: false })

  return data || []
}

const statusLabels: Record<string, { label: string; color: string }> = {
  DRAFT: { label: '작성 중', color: 'bg-gray-100 text-gray-700' },
  CONFIRMED: { label: '확정', color: 'bg-green-100 text-green-700' },
  PACKING: { label: '패킹 중', color: 'bg-purple-100 text-purple-700' },
  SHIPPED: { label: '출하', color: 'bg-cyan-100 text-cyan-700' },
  COMPLETED: { label: '완료', color: 'bg-emerald-100 text-emerald-700' },
  CANCELLED: { label: '취소', color: 'bg-red-100 text-red-700' },
}

export default async function OrderDetailPage({
  params,
  searchParams
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ dest?: string }>
}) {
  const { id } = await params
  const { dest: initialDestFilter } = await searchParams
  const [order, items, packingLists] = await Promise.all([
    getOrder(id),
    getOrderItems(id),
    getPackingLists(id)
  ])

  if (!order) {
    notFound()
  }

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

  // 목적지 목록 추출
  const destinations = [...new Set(items.map(item => item.destination).filter(Boolean))] as string[]

  // 품목별로 그룹화 (목적지별 수량 집계)
  const productGroups = new Map<string, {
    product_code: string
    product_name: string
    unit_price: number
    supply_price: number
    commission: number
    byDestination: Map<string, { qty: number; subtotal: number }>
    totalQty: number
    totalSubtotal: number
  }>()

  items.forEach(item => {
    const key = item.product_code
    const qty = item.confirmed_qty ?? item.requested_qty
    const subtotal = item.subtotal || (qty * (item.unit_price || 0))
    const dest = item.destination || '미지정'

    if (!productGroups.has(key)) {
      productGroups.set(key, {
        product_code: item.product_code,
        product_name: item.product_name || '',
        unit_price: item.unit_price || 0,
        supply_price: item.supply_price || 0,
        commission: item.commission || 0,
        byDestination: new Map(),
        totalQty: 0,
        totalSubtotal: 0
      })
    }

    const group = productGroups.get(key)!
    const existing = group.byDestination.get(dest) || { qty: 0, subtotal: 0 }
    group.byDestination.set(dest, {
      qty: existing.qty + qty,
      subtotal: existing.subtotal + subtotal
    })
    group.totalQty += qty
    group.totalSubtotal += subtotal
  })

  // 목적지별 합계
  const destinationTotals = new Map<string, { qty: number; amount: number }>()
  items.forEach(item => {
    const dest = item.destination || '미지정'
    const qty = item.confirmed_qty ?? item.requested_qty
    const subtotal = item.subtotal || (qty * (item.unit_price || 0))
    const existing = destinationTotals.get(dest) || { qty: 0, amount: 0 }
    destinationTotals.set(dest, {
      qty: existing.qty + qty,
      amount: existing.amount + subtotal
    })
  })

  const allDestinations = destinations.length > 0 ? destinations : ['미지정']

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
            {order.destination || '-'} | 발주일: {formatDate(order.order_date)}
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <Link href="/orders">
            <Button variant="outline">목록으로</Button>
          </Link>
          <OrderActions orderId={id} currentStatus={order.status} />
        </div>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{items.length}</div>
            <div className="text-sm text-muted-foreground">품목수</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{destinations.length || 1}</div>
            <div className="text-sm text-muted-foreground">목적지</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">
              {order.total_qty?.toLocaleString() || 0}
            </div>
            <div className="text-sm text-muted-foreground">총 수량</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">
              {order.total_cartons?.toLocaleString() || 0}
            </div>
            <div className="text-sm text-muted-foreground">총 박스</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-primary">
              ₩{formatCurrency(order.total_amount || 0)}
            </div>
            <div className="text-sm text-muted-foreground">총 금액</div>
          </CardContent>
        </Card>
      </div>

      {/* 패킹리스트 링크 */}
      {packingLists.length > 0 && (
        <Card className="mb-6 border-purple-200 bg-purple-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-purple-800">패킹리스트</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {packingLists.map(pl => (
                <Link key={pl.pl_number} href={`/packing/${pl.pl_number}`}>
                  <Badge variant="secondary" className="cursor-pointer hover:bg-purple-200">
                    {pl.pl_number}
                    <span className="ml-2 text-muted-foreground">
                      ({pl.total_qty?.toLocaleString()}개 / {formatDate(pl.created_date)})
                    </span>
                  </Badge>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 발주 품목 - 탭으로 구분 */}
      <Tabs defaultValue="by-destination" className="space-y-4">
        <TabsList>
          <TabsTrigger value="by-destination">목적지별 수량</TabsTrigger>
          <TabsTrigger value="all-items">전체 품목</TabsTrigger>
        </TabsList>

        {/* 목적지별 수량 보기 */}
        <TabsContent value="by-destination">
          <Card>
            <CardHeader>
              <CardTitle>품목별 목적지 수량</CardTitle>
            </CardHeader>
            <CardContent>
              <DestinationQtyTable
                productGroups={Array.from(productGroups.values())}
                destinations={allDestinations}
                destinationTotals={destinationTotals}
                totalQty={order.total_qty || 0}
                totalAmount={order.total_amount || 0}
                initialDestinationFilter={initialDestFilter}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* 전체 품목 보기 */}
        <TabsContent value="all-items">
          <Card>
            <CardHeader>
              <CardTitle>발주 품목 전체</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>품목코드</TableHead>
                    <TableHead>품목명</TableHead>
                    <TableHead>목적지</TableHead>
                    <TableHead className="text-center">요청수량</TableHead>
                    <TableHead className="text-center">확정수량</TableHead>
                    <TableHead className="text-right">본사가</TableHead>
                    <TableHead className="text-right">커미션</TableHead>
                    <TableHead className="text-right">단가</TableHead>
                    <TableHead className="text-right">금액</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item: OrderItem) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-mono">{item.product_code}</TableCell>
                      <TableCell>{item.product_name || '-'}</TableCell>
                      <TableCell>
                        {item.destination ? (
                          <Badge variant="outline" className="text-xs">
                            {item.destination.split(' ')[0]}
                          </Badge>
                        ) : '-'}
                      </TableCell>
                      <TableCell className="text-center">
                        {item.requested_qty?.toLocaleString()}
                      </TableCell>
                      <TableCell className="text-center">
                        {item.confirmed_qty !== undefined && item.confirmed_qty !== null ? (
                          <span className={item.confirmed_qty !== item.requested_qty ? 'text-orange-600 font-medium' : ''}>
                            {item.confirmed_qty.toLocaleString()}
                          </span>
                        ) : '-'}
                      </TableCell>
                      <TableCell className="text-right">₩{formatCurrency(item.supply_price || 0)}</TableCell>
                      <TableCell className="text-right">₩{formatCurrency(item.commission || 0)}</TableCell>
                      <TableCell className="text-right">₩{formatCurrency(item.unit_price || 0)}</TableCell>
                      <TableCell className="text-right font-medium">₩{formatCurrency(item.subtotal || 0)}</TableCell>
                    </TableRow>
                  ))}
                  {items.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                        발주 품목이 없습니다.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

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

      {/* 변경 이력 */}
      {order.history && order.history.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>변경 이력</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {order.history.map((h: { date: string; action: string; by: string; changes?: string }, idx: number) => (
                <div key={idx} className="flex gap-4 text-sm">
                  <span className="text-muted-foreground w-40">
                    {new Date(h.date).toLocaleString('ko-KR')}
                  </span>
                  <span className="font-medium">{h.action}</span>
                  <span className="text-muted-foreground">by {h.by}</span>
                  {h.changes && <span className="text-muted-foreground">({h.changes})</span>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
