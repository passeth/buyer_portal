'use client'

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import type { OrderItem, AvailabilityStatus } from '@/types'

interface OrderDetailProps {
  items: OrderItem[]
  showAvailability?: boolean  // 에바스/매니저용
  showPriceDetails?: boolean  // 매니저/공급사용 (본사가, 커미션)
}

// 출고 가능 상태 배지 설정
const availabilityConfig: Record<AvailabilityStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline'; className?: string }> = {
  pending: { label: '확인대기', variant: 'secondary' },
  available: { label: '출고가능', variant: 'default', className: 'bg-green-600' },
  partial: { label: '일부가능', variant: 'default', className: 'bg-orange-500' },
  unavailable: { label: '출고불가', variant: 'destructive' },
}

export function OrderDetail({ items, showAvailability = true, showPriceDetails = false }: OrderDetailProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR').format(price)
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[50px]">No</TableHead>
            <TableHead>품목코드</TableHead>
            <TableHead>품목명</TableHead>
            <TableHead className="text-center">요청수량</TableHead>
            <TableHead className="text-center">확정수량</TableHead>
            {showAvailability && (
              <TableHead className="text-center">출고상태</TableHead>
            )}
            {showPriceDetails && (
              <>
                <TableHead className="text-right">본사가</TableHead>
                <TableHead className="text-right">커미션</TableHead>
              </>
            )}
            <TableHead className="text-right">단가</TableHead>
            <TableHead className="text-right">금액</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={showPriceDetails ? 10 : (showAvailability ? 8 : 7)} className="text-center py-8 text-muted-foreground">
                발주 품목이 없습니다.
              </TableCell>
            </TableRow>
          ) : (
            items.map((item, index) => {
              const requestedQty = item.requested_qty
              const confirmedQty = item.confirmed_qty
              const displayQty = confirmedQty ?? requestedQty
              const subtotal = item.subtotal || (displayQty * item.unit_price)
              const isAdjusted = confirmedQty != null && confirmedQty !== requestedQty
              const availability = item.availability_status || 'pending'
              const availConfig = availabilityConfig[availability]

              return (
                <TableRow key={item.id}>
                  <TableCell className="text-center text-muted-foreground">{index + 1}</TableCell>
                  <TableCell className="font-mono text-sm">{item.product_code}</TableCell>
                  <TableCell className="max-w-[180px]">
                    <div className="truncate text-sm">{item.product_name || '-'}</div>
                  </TableCell>
                  <TableCell className="text-center">
                    {requestedQty.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-center">
                    {confirmedQty != null ? (
                      <span className={isAdjusted ? 'text-orange-600 font-medium' : ''}>
                        {confirmedQty.toLocaleString()}
                        {isAdjusted && (
                          <span className="text-xs ml-1">
                            ({confirmedQty > requestedQty ? '+' : ''}
                            {confirmedQty - requestedQty})
                          </span>
                        )}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  {showAvailability && (
                    <TableCell className="text-center">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            <Badge
                              variant={availConfig.variant}
                              className={availConfig.className}
                            >
                              {availConfig.label}
                            </Badge>
                          </TooltipTrigger>
                          {item.availability_note && (
                            <TooltipContent>
                              <p>{item.availability_note}</p>
                            </TooltipContent>
                          )}
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                  )}
                  {showPriceDetails && (
                    <>
                      <TableCell className="text-right text-sm">
                        ₩{formatPrice(item.supply_price || 0)}
                      </TableCell>
                      <TableCell className="text-right text-sm">
                        ₩{formatPrice(item.commission || 0)}
                      </TableCell>
                    </>
                  )}
                  <TableCell className="text-right">
                    ₩{formatPrice(item.unit_price)}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    ₩{formatPrice(subtotal)}
                  </TableCell>
                </TableRow>
              )
            })
          )}
        </TableBody>
      </Table>
    </div>
  )
}
