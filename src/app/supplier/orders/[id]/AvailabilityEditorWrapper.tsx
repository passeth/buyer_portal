'use client'

import { AvailabilityEditor } from '@/components/orders/AvailabilityEditor'

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
  currentStock?: number
}

interface AvailabilityEditorWrapperProps {
  orderId: string
  items: OrderItem[]
}

export function AvailabilityEditorWrapper({ orderId, items }: AvailabilityEditorWrapperProps) {
  return (
    <AvailabilityEditor
      orderId={orderId}
      items={items}
      onUpdate={() => window.location.reload()}
    />
  )
}
