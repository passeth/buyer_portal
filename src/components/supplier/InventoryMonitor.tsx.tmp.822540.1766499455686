'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

interface LowStockItem {
  product_id: string
  name: string
  bal_qty: number
}

interface ExpiringLot {
  product_id?: string
  product_name?: string
  lot_no?: string
  exp_date?: string
  qty?: number
  days_until_expiry?: number
}

interface InventoryMonitorProps {
  lowStock: LowStockItem[]
  expiringLots: ExpiringLot[]
}

export function InventoryMonitor({ lowStock, expiringLots }: InventoryMonitorProps) {
  const formatDate = (dateString?: string) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    })
  }

  const getExpiryBadge = (days?: number) => {
    if (days === undefined) return null
    if (days <= 30) {
      return <Badge variant="destructive">D-{days}</Badge>
    }
    if (days <= 60) {
      return <Badge className="bg-orange-500">D-{days}</Badge>
    }
    return <Badge variant="secondary">D-{days}</Badge>
  }

  const getStockLevel = (qty: number) => {
    if (qty <= 20) {
      return <Badge variant="destructive">긴급</Badge>
    }
    if (qty <= 50) {
      return <Badge className="bg-orange-500">부족</Badge>
    }
    return <Badge variant="secondary">주의</Badge>
  }

  return (
    <>
      {/* 재고 부족 품목 */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-orange-500"></span>
            재고 부족 품목
          </CardTitle>
        </CardHeader>
        <CardContent>
          {lowStock.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-4">
              재고 부족 품목 없음
            </div>
          ) : (
            <div className="space-y-2">
              {lowStock.map((item, index) => (
                <div
                  key={item.product_id || index}
                  className="flex items-center justify-between p-2 rounded border bg-muted/50"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-mono text-xs text-muted-foreground">
                      {item.product_id}
                    </div>
                    <div className="text-sm truncate">{item.name}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{item.bal_qty}</span>
                    {getStockLevel(item.bal_qty)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 유통기한 임박 LOT */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-500"></span>
            유통기한 임박 LOT (3개월 이내)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {expiringLots.length === 0 ? (
            <div className="text-sm text-muted-foreground text-center py-4">
              유통기한 임박 LOT 없음
            </div>
          ) : (
            <div className="border rounded overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="text-xs">
                    <TableHead className="py-2">품목</TableHead>
                    <TableHead className="py-2">LOT</TableHead>
                    <TableHead className="py-2 text-right">수량</TableHead>
                    <TableHead className="py-2 text-right">유통기한</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expiringLots.map((lot, index) => (
                    <TableRow key={lot.lot_no || index} className="text-xs">
                      <TableCell className="py-2">
                        <div className="truncate max-w-[100px]" title={lot.product_name}>
                          {lot.product_name || lot.product_id || '-'}
                        </div>
                      </TableCell>
                      <TableCell className="py-2 font-mono">
                        {lot.lot_no || '-'}
                      </TableCell>
                      <TableCell className="py-2 text-right">
                        {lot.qty?.toLocaleString() || '-'}
                      </TableCell>
                      <TableCell className="py-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <span className="text-muted-foreground">
                            {formatDate(lot.exp_date)}
                          </span>
                          {getExpiryBadge(lot.days_until_expiry)}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  )
}
