'use client'

import { useState } from 'react'
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
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import type { AvailabilityStatus } from '@/types'

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
  availability_status?: AvailabilityStatus
  availability_note?: string
}

interface AvailabilityEditorProps {
  orderId: string
  items: OrderItem[]
  onUpdate?: () => void
}

const availabilityOptions: { value: AvailabilityStatus; label: string; color: string }[] = [
  { value: 'pending', label: '확인대기', color: 'bg-gray-100 text-gray-700' },
  { value: 'available', label: '출고가능', color: 'bg-green-100 text-green-700' },
  { value: 'partial', label: '일부가능', color: 'bg-orange-100 text-orange-700' },
  { value: 'unavailable', label: '출고불가', color: 'bg-red-100 text-red-700' },
]

export function AvailabilityEditor({ orderId, items, onUpdate }: AvailabilityEditorProps) {
  const [editingItem, setEditingItem] = useState<OrderItem | null>(null)
  const [status, setStatus] = useState<AvailabilityStatus>('pending')
  const [confirmedQty, setConfirmedQty] = useState<number>(0)
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [bulkUpdating, setBulkUpdating] = useState(false)

  const formatPrice = (price: number) => new Intl.NumberFormat('ko-KR').format(price)

  const openEditor = (item: OrderItem) => {
    setEditingItem(item)
    setStatus((item.availability_status as AvailabilityStatus) || 'pending')
    setConfirmedQty(item.confirmed_qty ?? item.requested_qty)
    setNote(item.availability_note || '')
  }

  const closeEditor = () => {
    setEditingItem(null)
    setStatus('pending')
    setConfirmedQty(0)
    setNote('')
  }

  const handleSave = async () => {
    if (!editingItem) return
    setLoading(true)

    try {
      const response = await fetch(`/api/orders/${orderId}/items/${editingItem.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          availability_status: status,
          confirmed_qty: status === 'partial' ? confirmedQty : (status === 'available' ? editingItem.requested_qty : (status === 'unavailable' ? 0 : undefined)),
          availability_note: note || undefined,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '업데이트 실패')
      }

      closeEditor()
      onUpdate?.()
    } catch (error) {
      console.error('Failed to update availability:', error)
      alert(error instanceof Error ? error.message : '업데이트 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  // 전체 출고 가능 처리
  const handleBulkAvailable = async () => {
    if (!confirm('모든 품목을 "출고가능"으로 설정하시겠습니까?')) return
    setBulkUpdating(true)

    try {
      const pendingItems = items.filter(item => item.availability_status !== 'available')

      for (const item of pendingItems) {
        await fetch(`/api/orders/${orderId}/items/${item.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            availability_status: 'available',
            confirmed_qty: item.requested_qty,
          }),
        })
      }

      onUpdate?.()
    } catch (error) {
      console.error('Bulk update failed:', error)
      alert('일괄 업데이트 중 오류가 발생했습니다.')
    } finally {
      setBulkUpdating(false)
    }
  }

  const getStatusBadge = (availability: AvailabilityStatus | undefined) => {
    const option = availabilityOptions.find(o => o.value === (availability || 'pending'))
    return option ? (
      <Badge className={option.color}>{option.label}</Badge>
    ) : null
  }

  const pendingCount = items.filter(item => !item.availability_status || item.availability_status === 'pending').length
  const availableCount = items.filter(item => item.availability_status === 'available').length
  const partialCount = items.filter(item => item.availability_status === 'partial').length
  const unavailableCount = items.filter(item => item.availability_status === 'unavailable').length

  return (
    <div className="space-y-4">
      {/* 요약 및 일괄 액션 */}
      <div className="flex justify-between items-center">
        <div className="flex gap-4 text-sm">
          <span className="text-muted-foreground">
            확인대기: <span className="font-medium">{pendingCount}</span>
          </span>
          <span className="text-green-600">
            출고가능: <span className="font-medium">{availableCount}</span>
          </span>
          <span className="text-orange-600">
            일부가능: <span className="font-medium">{partialCount}</span>
          </span>
          <span className="text-red-600">
            출고불가: <span className="font-medium">{unavailableCount}</span>
          </span>
        </div>
        {pendingCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleBulkAvailable}
            disabled={bulkUpdating}
          >
            {bulkUpdating ? '처리 중...' : '전체 출고가능 처리'}
          </Button>
        )}
      </div>

      {/* 품목 테이블 */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>품목코드</TableHead>
              <TableHead>품목명</TableHead>
              <TableHead>목적지</TableHead>
              <TableHead className="text-center">요청수량</TableHead>
              <TableHead className="text-center">확정수량</TableHead>
              <TableHead className="text-center">출고상태</TableHead>
              <TableHead className="text-right">금액</TableHead>
              <TableHead className="text-center">액션</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => {
              const qty = item.confirmed_qty ?? item.requested_qty
              const subtotal = item.subtotal || (qty * (item.unit_price || 0))
              const isAdjusted = item.confirmed_qty != null && item.confirmed_qty !== item.requested_qty

              return (
                <TableRow key={item.id}>
                  <TableCell className="font-mono text-sm">{item.product_code}</TableCell>
                  <TableCell className="max-w-[150px] truncate">{item.product_name || '-'}</TableCell>
                  <TableCell>
                    {item.destination ? (
                      <Badge variant="outline" className="text-xs">
                        {item.destination.split(' ')[0]}
                      </Badge>
                    ) : '-'}
                  </TableCell>
                  <TableCell className="text-center">{item.requested_qty.toLocaleString()}</TableCell>
                  <TableCell className="text-center">
                    {item.confirmed_qty != null ? (
                      <span className={isAdjusted ? 'text-orange-600 font-medium' : ''}>
                        {item.confirmed_qty.toLocaleString()}
                      </span>
                    ) : '-'}
                  </TableCell>
                  <TableCell className="text-center">
                    {getStatusBadge(item.availability_status)}
                    {item.availability_note && (
                      <div className="text-xs text-muted-foreground mt-1 truncate max-w-[100px]">
                        {item.availability_note}
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-right">₩{formatPrice(subtotal)}</TableCell>
                  <TableCell className="text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditor(item)}
                    >
                      수정
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* 수정 다이얼로그 */}
      <Dialog open={!!editingItem} onOpenChange={() => closeEditor()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>출고 가능 여부 설정</DialogTitle>
          </DialogHeader>

          {editingItem && (
            <div className="space-y-4">
              <div className="bg-muted p-3 rounded-lg">
                <div className="font-mono text-sm">{editingItem.product_code}</div>
                <div className="text-sm text-muted-foreground">{editingItem.product_name}</div>
                <div className="text-sm mt-1">
                  요청수량: <span className="font-medium">{editingItem.requested_qty.toLocaleString()}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label>출고 상태</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as AvailabilityStatus)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availabilityOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <span className={`px-2 py-0.5 rounded text-xs ${option.color}`}>
                          {option.label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {status === 'partial' && (
                <div className="space-y-2">
                  <Label>확정 수량</Label>
                  <Input
                    type="number"
                    min={0}
                    max={editingItem.requested_qty}
                    value={confirmedQty}
                    onChange={(e) => setConfirmedQty(parseInt(e.target.value) || 0)}
                  />
                  <p className="text-xs text-muted-foreground">
                    요청 수량 {editingItem.requested_qty.toLocaleString()} 중 출고 가능한 수량을 입력하세요.
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label>코멘트 (선택)</Label>
                <Textarea
                  placeholder="재고 부족, 생산 예정일 등 참고사항을 입력하세요."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={closeEditor}>취소</Button>
            <Button onClick={handleSave} disabled={loading}>
              {loading ? '저장 중...' : '저장'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
