'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Order, OrderStatus } from '@/types'

interface ExtendedOrder extends Order {
  packing_lists?: string[]
  destinations?: string[]
}

interface OrdersTableProps {
  orders: ExtendedOrder[]
}

const statusLabels: Record<OrderStatus, { label: string; color: string }> = {
  DRAFT: { label: '작성 중', color: 'bg-gray-100 text-gray-700' },
  CONFIRMED: { label: '확정', color: 'bg-green-100 text-green-700' },
  PACKING: { label: '패킹', color: 'bg-purple-100 text-purple-700' },
  SHIPPED: { label: '출하', color: 'bg-cyan-100 text-cyan-700' },
  COMPLETED: { label: '완료', color: 'bg-emerald-100 text-emerald-700' },
  CANCELLED: { label: '취소', color: 'bg-red-100 text-red-700' },
}

export function OrdersTable({ orders }: OrdersTableProps) {
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      return statusFilter === 'all' || order.status === statusFilter
    })
  }, [orders, statusFilter])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
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

  return (
    <div className="space-y-4">
      {/* 필터 */}
      <div className="flex gap-4 flex-wrap">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="상태 선택" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체 상태</SelectItem>
            {Object.entries(statusLabels).map(([value, { label }]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="text-sm text-muted-foreground self-center">
          {filteredOrders.length}개 발주
        </div>
      </div>

      {/* 테이블 */}
      <div className="border rounded-lg overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>발주번호</TableHead>
              <TableHead>바이어</TableHead>
              <TableHead>목적지</TableHead>
              <TableHead>발주일</TableHead>
              <TableHead className="text-center">수량</TableHead>
              <TableHead className="text-right">금액</TableHead>
              <TableHead className="text-center">상태</TableHead>
              <TableHead className="text-center">패킹리스트</TableHead>
              <TableHead className="text-center">액션</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                  발주 내역이 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              filteredOrders.map((order) => {
                const status = statusLabels[order.status]
                const hasPackingList = order.packing_lists && order.packing_lists.length > 0

                return (
                  <TableRow key={order.id}>
                    <TableCell className="font-mono font-medium">
                      <Link href={`/orders/${order.id}`} className="hover:underline text-primary">
                        {order.order_number}
                      </Link>
                    </TableCell>
                    <TableCell>
                      {order.buyer_name || '-'}
                    </TableCell>
                    <TableCell>
                      {order.destinations && order.destinations.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {order.destinations.slice(0, 2).map((dest, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {dest.split(' ')[0]}
                            </Badge>
                          ))}
                          {order.destinations.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{order.destinations.length - 2}
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">
                          {order.destination?.split(' ')[0] || '-'}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {formatDate(order.order_date)}
                    </TableCell>
                    <TableCell className="text-center">
                      {order.total_qty?.toLocaleString() || 0}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(order.total_amount || 0)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge className={status?.color}>
                        {status?.label || order.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center align-top py-3">
                      {hasPackingList ? (
                        <div className="flex flex-wrap gap-1 justify-center">
                          {order.packing_lists!.map((pl, idx) => (
                            <Link key={idx} href={`/packing/${pl}`}>
                              <Badge variant="secondary" className="text-xs cursor-pointer hover:bg-muted whitespace-nowrap">
                                {pl}
                              </Badge>
                            </Link>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <Link href={`/orders/${order.id}`}>
                        <Button variant="ghost" size="sm">
                          상세
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                )
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
