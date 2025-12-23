'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

interface SupplierOrderActionsProps {
  orderId: string
  currentStatus: string
}

export function SupplierOrderActions({ orderId, currentStatus }: SupplierOrderActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleStatusChange = async (newStatus: string) => {
    const statusLabels: Record<string, string> = {
      PACKING: '패킹 단계',
      SHIPPED: '출하 완료',
      COMPLETED: '거래 완료'
    }

    if (!confirm(`발주 상태를 "${statusLabels[newStatus]}"(으)로 변경하시겠습니까?`)) {
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: newStatus,
          history_action: `상태 변경: ${statusLabels[newStatus]}`,
          history_by: 'supplier'
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

  // CONFIRMED → PACKING
  if (currentStatus === 'CONFIRMED') {
    return (
      <div className="flex gap-2">
        <Button
          onClick={() => handleStatusChange('PACKING')}
          disabled={loading}
          className="bg-purple-600 hover:bg-purple-700"
        >
          {loading ? '처리 중...' : '패킹 시작'}
        </Button>
        <p className="text-sm text-muted-foreground self-center">
          패킹 단계로 진행하면 패킹리스트를 생성할 수 있습니다.
        </p>
      </div>
    )
  }

  // PACKING → SHIPPED
  if (currentStatus === 'PACKING') {
    return (
      <div className="flex gap-2">
        <Button
          onClick={() => handleStatusChange('SHIPPED')}
          disabled={loading}
          className="bg-cyan-600 hover:bg-cyan-700"
        >
          {loading ? '처리 중...' : '출하 완료'}
        </Button>
        <p className="text-sm text-muted-foreground self-center">
          모든 패킹이 완료되고 출하되었으면 클릭하세요.
        </p>
      </div>
    )
  }

  // SHIPPED → COMPLETED
  if (currentStatus === 'SHIPPED') {
    return (
      <div className="flex gap-2">
        <Button
          onClick={() => handleStatusChange('COMPLETED')}
          disabled={loading}
          className="bg-emerald-600 hover:bg-emerald-700"
        >
          {loading ? '처리 중...' : '거래 완료'}
        </Button>
        <p className="text-sm text-muted-foreground self-center">
          바이어가 물품을 수령하고 거래가 완료되었으면 클릭하세요.
        </p>
      </div>
    )
  }

  return null
}
