'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface OrderActionsProps {
  orderId: string
  currentStatus: string
}

export function OrderActions({ orderId, currentStatus }: OrderActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleStatusChange = async (newStatus: string) => {
    const statusLabels: Record<string, string> = {
      CONFIRMED: '확정',
      PACKING: '패킹 시작',
      CANCELLED: '취소'
    }

    const message = newStatus === 'CANCELLED'
      ? '발주를 취소하시겠습니까? 이 작업은 되돌릴 수 없습니다.'
      : `발주를 "${statusLabels[newStatus]}" 상태로 변경하시겠습니까?`

    if (!confirm(message)) return

    setLoading(true)

    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          history_action: `상태 변경: ${statusLabels[newStatus]}`,
          history_by: 'manager'
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || '상태 변경 실패')
      }

      router.refresh()
    } catch (error) {
      console.error('Status change failed:', error)
      alert(error instanceof Error ? error.message : '상태 변경 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  // DRAFT 상태: 수정, 확정, 취소
  if (currentStatus === 'DRAFT') {
    return (
      <div className="flex gap-2">
        <Link href={`/orders/${orderId}/edit`}>
          <Button variant="outline">수정</Button>
        </Link>
        <Button
          onClick={() => handleStatusChange('CONFIRMED')}
          disabled={loading}
          className="bg-green-600 hover:bg-green-700"
        >
          {loading ? '처리 중...' : '발주 확정'}
        </Button>
        <Button
          variant="destructive"
          onClick={() => handleStatusChange('CANCELLED')}
          disabled={loading}
        >
          취소
        </Button>
      </div>
    )
  }

  // CONFIRMED 상태: 패킹 시작, 취소
  if (currentStatus === 'CONFIRMED') {
    return (
      <div className="flex gap-2">
        <Link href={`/supplier/orders/${orderId}`}>
          <Button variant="outline">출고 컨펌</Button>
        </Link>
        <Button
          onClick={() => handleStatusChange('PACKING')}
          disabled={loading}
          className="bg-purple-600 hover:bg-purple-700"
        >
          {loading ? '처리 중...' : '패킹 시작'}
        </Button>
        <Button
          variant="destructive"
          onClick={() => handleStatusChange('CANCELLED')}
          disabled={loading}
        >
          취소
        </Button>
      </div>
    )
  }

  // PACKING 상태: 출하 완료
  if (currentStatus === 'PACKING') {
    return (
      <div className="flex gap-2">
        <Link href={`/packing`}>
          <Button variant="outline">패킹리스트</Button>
        </Link>
        <Button
          onClick={() => handleStatusChange('SHIPPED')}
          disabled={loading}
          className="bg-cyan-600 hover:bg-cyan-700"
        >
          {loading ? '처리 중...' : '출하 완료'}
        </Button>
      </div>
    )
  }

  // SHIPPED 상태: 거래 완료
  if (currentStatus === 'SHIPPED') {
    return (
      <Button
        onClick={() => handleStatusChange('COMPLETED')}
        disabled={loading}
        className="bg-emerald-600 hover:bg-emerald-700"
      >
        {loading ? '처리 중...' : '거래 완료'}
      </Button>
    )
  }

  return null
}
