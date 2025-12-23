'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { useToast } from '@/hooks/use-toast'
import type { AvailabilityStatus } from '@/types'

// 발주 상태 색상
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

// 출고 가능 상태 설정
const availabilityConfig: Record<AvailabilityStatus, { label: string; color: string }> = {
  pending: { label: '확인대기', color: 'bg-gray-100 text-gray-600' },
  available: { label: '출고가능', color: 'bg-green-100 text-green-700' },
  partial: { label: '일부가능', color: 'bg-orange-100 text-orange-700' },
  unavailable: { label: '출고불가', color: 'bg-red-100 text-red-700' },
}

interface OrderItem {
  id: string
  product_code: string
  product_name?: string
  requested_qty: number
  confirmed_qty?: number
  unit_price?: number
  subtotal?: number
  availability_status?: AvailabilityStatus
  availability_note?: string
}

interface Order {
  id: string
  order_number: string
  buyer_name?: string
  destination?: string
  status: string
  total_qty?: number
  total_amount?: number
  created_at: string
  items?: OrderItem[]
}

interface SupplierOrderListProps {
  orders: Order[]
}

export function SupplierOrderList({ orders }: SupplierOrderListProps) {
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set())
  const [updatingItems, setUpdatingItems] = useState<Set<string>>(new Set())
  const { toast } = useToast()

  const toggleOrder = (orderId: string) => {
    setExpandedOrders(prev => {
      const next = new Set(prev)
      if (next.has(orderId)) {
        next.delete(orderId)
      } else {
        next.add(orderId)
      }
      return next
    })
  }

  // 품목별 출고 가능 여부 업데이트
  const updateItemAvailability = async (
    orderId: string,
    itemId: string,
    status: AvailabilityStatus,
    confirmedQty?: number,
    note?: string
  ) => {
    const itemKey = `${orderId}-${itemId}`
    setUpdatingItems(prev => new Set(prev).add(itemKey))

    try {
      const body: Record<string, unknown> = {
        availability_status: status,
        updated_by: 'supplier'
      }

      if (confirmedQty !== undefined) {
        body.confirmed_qty = confirmedQty
      }

      if (note !== undefined) {
        body.availability_note = note
      }

      const response = await fetch(`/api/orders/${orderId}/items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || '업데이트 실패')
      }

      toast({
        title: '출고 가능 여부 업데이트 완료',
        description: `상태: ${availabilityConfig[status].label}`,
      })

      // 페이지 새로고침으로 데이터 갱신
      window.location.reload()
    } catch (error) {
      console.error('Availability update error:', error)
      toast({
        title: '업데이트 실패',
        description: error instanceof Error ? error.message : '알 수 없는 오류',
        variant: 'destructive'
      })
    } finally {
      setUpdatingItems(prev => {
        const next = new Set(prev)
        next.delete(itemKey)
        return next
      })
    }
  }

  // 품목별 가용성 통계
  const getAvailabilityStats = (items: OrderItem[] = []) => {
    const stats = {
      pending: 0,
      available: 0,
      partial: 0,
      unavailable: 0
    }
    items.forEach(item => {
      const status = item.availability_status || 'pending'
      stats[status]++
    })
    return stats
  }

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

  if (orders.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        진행 중인 발주가 없습니다.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {orders.map(order => {
        const isExpanded = expandedOrders.has(order.id)
        const stats = getAvailabilityStats(order.items)
        const totalItems = order.items?.length || 0
        const confirmedItems = stats.available + stats.partial + stats.unavailable

        return (
          <Collapsible
            key={order.id}
            open={isExpanded}
            onOpenChange={() => toggleOrder(order.id)}
          >
            <div className="border rounded-lg">
              {/* 발주 헤더 */}
              <CollapsibleTrigger asChild>
                <div className="p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-medium">{order.order_number}</span>
                      <Badge className={statusColors[order.status]}>
                        {statusLabels[order.status]}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{order.destination}</span>
                      <span>{formatDate(order.created_at)}</span>
                    </div>
                  </div>

                  {/* 진행 상황 바 */}
                  <div className="mt-3 flex items-center gap-2">
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      {totalItems > 0 && (
                        <div className="h-full flex">
                          {stats.available > 0 && (
                            <div
                              className="bg-green-500"
                              style={{ width: `${(stats.available / totalItems) * 100}%` }}
                            />
                          )}
                          {stats.partial > 0 && (
                            <div
                              className="bg-orange-500"
                              style={{ width: `${(stats.partial / totalItems) * 100}%` }}
                            />
                          )}
                          {stats.unavailable > 0 && (
                            <div
                              className="bg-red-500"
                              style={{ width: `${(stats.unavailable / totalItems) * 100}%` }}
                            />
                          )}
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {confirmedItems}/{totalItems} 확인
                    </span>
                  </div>

                  {/* 요약 정보 */}
                  <div className="mt-2 flex items-center gap-4 text-sm">
                    <span>총 {order.total_qty?.toLocaleString() || 0}개</span>
                    <span>₩{formatPrice(order.total_amount || 0)}</span>
                    <span className="text-xs text-muted-foreground">
                      (클릭하여 {isExpanded ? '접기' : '품목 보기'})
                    </span>
                  </div>
                </div>
              </CollapsibleTrigger>

              {/* 품목 상세 */}
              <CollapsibleContent>
                <div className="border-t p-4 bg-muted/30">
                  <div className="space-y-2">
                    {order.items?.map(item => {
                      const itemKey = `${order.id}-${item.id}`
                      const isUpdating = updatingItems.has(itemKey)
                      const availStatus = item.availability_status || 'pending'
                      const availConf = availabilityConfig[availStatus]

                      return (
                        <div
                          key={item.id}
                          className="flex items-center gap-4 p-3 bg-background rounded border"
                        >
                          {/* 품목 정보 */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm">{item.product_code}</span>
                              <span className={`px-2 py-0.5 rounded text-xs ${availConf.color}`}>
                                {availConf.label}
                              </span>
                            </div>
                            <div className="text-sm text-muted-foreground truncate">
                              {item.product_name || '-'}
                            </div>
                          </div>

                          {/* 수량 */}
                          <div className="text-center min-w-[80px]">
                            <div className="text-sm font-medium">
                              {item.requested_qty.toLocaleString()}개
                            </div>
                            {item.confirmed_qty !== undefined && item.confirmed_qty !== item.requested_qty && (
                              <div className="text-xs text-orange-600">
                                → {item.confirmed_qty.toLocaleString()}개
                              </div>
                            )}
                          </div>

                          {/* 출고 가능 여부 선택 */}
                          <div className="flex items-center gap-2">
                            <Select
                              value={availStatus}
                              onValueChange={(value: AvailabilityStatus) => {
                                if (value === 'partial') {
                                  // partial인 경우 수량 입력 필요
                                  const qty = prompt('출고 가능 수량을 입력하세요:', String(item.requested_qty))
                                  if (qty !== null) {
                                    const confirmedQty = parseInt(qty)
                                    if (!isNaN(confirmedQty) && confirmedQty >= 0) {
                                      updateItemAvailability(order.id, item.id, value, confirmedQty)
                                    }
                                  }
                                } else if (value === 'available') {
                                  updateItemAvailability(order.id, item.id, value, item.requested_qty)
                                } else {
                                  updateItemAvailability(order.id, item.id, value)
                                }
                              }}
                              disabled={isUpdating}
                            >
                              <SelectTrigger className="w-[120px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">확인대기</SelectItem>
                                <SelectItem value="available">출고가능</SelectItem>
                                <SelectItem value="partial">일부가능</SelectItem>
                                <SelectItem value="unavailable">출고불가</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      )
                    })}
                  </div>

                  {/* 액션 버튼 */}
                  <div className="mt-4 flex justify-end gap-2">
                    <Link href={`/orders/${order.id}`}>
                      <Button variant="outline" size="sm">
                        상세 보기
                      </Button>
                    </Link>
                    <Link href={`/supplier/orders/${order.id}`}>
                      <Button variant="secondary" size="sm">
                        출고 컨펌
                      </Button>
                    </Link>
                    {order.status === 'CONFIRMED' && confirmedItems === totalItems && (
                      <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                        패킹 시작
                      </Button>
                    )}
                  </div>
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>
        )
      })}
    </div>
  )
}
