'use client'

import { useState, useMemo } from 'react'
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'

interface InventoryItem {
  product_id: string
  name: string
  bal_qty: number
  updated_at?: string
}

interface RuProduct {
  product_code: string
  name_ko: string
  brand?: string
  category?: string
}

interface LotInfo {
  lot_numbers?: string[]
  remaining_quantities?: number[]
  lot_statuses?: string[]
}

interface InventoryTableProps {
  inventory: InventoryItem[]
  productMap: Map<string, RuProduct>
  lotMap: Map<string, LotInfo>
  lotDateMap: Map<string, string>  // lot_number -> manufacturing_date (YYYY-MM-DD)
  confirmedQtyMap: Map<string, number>  // product_code -> confirmed order qty sum
}

// 컬럼 너비 설정
const defaultColumnWidths = {
  product_code: 120,
  product_name: 200,
  brand: 100,
  stock: 80,
  confirmed: 80,
  status: 70,
  lot: 320,
}

type SortField = 'product_code' | 'brand' | null
type SortDirection = 'asc' | 'desc'

// 제조일 포맷팅 (yy-mm-dd)
function formatMfgDate(dateStr: string | undefined): string {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  const yy = String(date.getFullYear()).slice(-2)
  const mm = String(date.getMonth() + 1).padStart(2, '0')
  const dd = String(date.getDate()).padStart(2, '0')
  return `${yy}-${mm}-${dd}`
}

// 제조일로부터 남은 개월 수 계산 (유통기한 3년 기준)
function calcRemainMonths(mfgDateStr: string | undefined): number | null {
  if (!mfgDateStr) return null
  const mfgDate = new Date(mfgDateStr)
  const expiryDate = new Date(mfgDate)
  expiryDate.setFullYear(expiryDate.getFullYear() + 3)  // 3년 후 유통기한

  const now = new Date()
  const diffMs = expiryDate.getTime() - now.getTime()
  const diffMonths = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30))
  return diffMonths
}

export function InventoryTable({ inventory, productMap, lotMap, lotDateMap, confirmedQtyMap }: InventoryTableProps) {
  const [columnWidths, setColumnWidths] = useState(defaultColumnWidths)
  const [editingLot, setEditingLot] = useState<{
    productId: string
    productName: string
    lots: { lotNumber: string; qty: number }[]
  } | null>(null)
  const [newLot, setNewLot] = useState({ lotNumber: '', qty: 0 })
  const [saving, setSaving] = useState(false)
  const [sortField, setSortField] = useState<SortField>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

  // 정렬된 재고 목록
  const sortedInventory = useMemo(() => {
    if (!sortField) return inventory

    return [...inventory].sort((a, b) => {
      let aVal: string = ''
      let bVal: string = ''

      if (sortField === 'product_code') {
        aVal = a.product_id
        bVal = b.product_id
      } else if (sortField === 'brand') {
        aVal = productMap.get(a.product_id)?.brand || ''
        bVal = productMap.get(b.product_id)?.brand || ''
      }

      const result = aVal.localeCompare(bVal, 'ko')
      return sortDirection === 'asc' ? result : -result
    })
  }, [inventory, sortField, sortDirection, productMap])

  // 정렬 토글
  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  // 정렬 아이콘
  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ArrowUpDown className="ml-1 h-3 w-3 inline opacity-50" />
    return sortDirection === 'asc'
      ? <ArrowUp className="ml-1 h-3 w-3 inline text-primary" />
      : <ArrowDown className="ml-1 h-3 w-3 inline text-primary" />
  }

  // 재고 상태 계산
  const getStockStatus = (qty: number) => {
    if (qty <= 0) return { label: '품절', color: 'bg-red-100 text-red-800' }
    if (qty < 50) return { label: '긴급', color: 'bg-red-100 text-red-800' }
    if (qty < 100) return { label: '부족', color: 'bg-orange-100 text-orange-800' }
    if (qty < 500) return { label: '주의', color: 'bg-yellow-100 text-yellow-800' }
    return { label: '정상', color: 'bg-green-100 text-green-800' }
  }

  // 컬럼 리사이즈 핸들러
  const handleResize = (column: keyof typeof defaultColumnWidths, delta: number) => {
    setColumnWidths(prev => ({
      ...prev,
      [column]: Math.max(60, prev[column] + delta)
    }))
  }

  // LOT 편집 열기
  const openLotEditor = (productId: string, productName: string) => {
    const lotInfo = lotMap.get(productId)
    const lots = lotInfo?.lot_numbers?.map((lotNum, idx) => ({
      lotNumber: lotNum,
      qty: lotInfo.remaining_quantities?.[idx] || 0
    })) || []

    setEditingLot({ productId, productName, lots })
  }

  // LOT 추가
  const addLot = () => {
    if (!editingLot || !newLot.lotNumber) return
    setEditingLot({
      ...editingLot,
      lots: [...editingLot.lots, { ...newLot }]
    })
    setNewLot({ lotNumber: '', qty: 0 })
  }

  // LOT 삭제
  const removeLot = (index: number) => {
    if (!editingLot) return
    setEditingLot({
      ...editingLot,
      lots: editingLot.lots.filter((_, i) => i !== index)
    })
  }

  // LOT 수량 변경
  const updateLotQty = (index: number, qty: number) => {
    if (!editingLot) return
    const newLots = [...editingLot.lots]
    newLots[index] = { ...newLots[index], qty }
    setEditingLot({ ...editingLot, lots: newLots })
  }

  // LOT 저장
  const saveLots = async () => {
    if (!editingLot) return
    setSaving(true)

    try {
      // cm_production_lots 테이블에 저장하는 API 호출
      const response = await fetch('/api/inventory/lots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: editingLot.productId,
          lots: editingLot.lots
        })
      })

      if (!response.ok) {
        throw new Error('LOT 저장 실패')
      }

      setEditingLot(null)
      window.location.reload()
    } catch (error) {
      console.error('LOT save error:', error)
      alert('LOT 저장 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  // 리사이즈 핸들 컴포넌트
  const ResizeHandle = ({ column }: { column: keyof typeof defaultColumnWidths }) => (
    <div
      className="absolute right-0 top-0 h-full w-1 cursor-col-resize hover:bg-primary/50"
      onMouseDown={(e) => {
        const startX = e.clientX
        const startWidth = columnWidths[column]

        const onMouseMove = (moveEvent: MouseEvent) => {
          const delta = moveEvent.clientX - startX
          setColumnWidths(prev => ({
            ...prev,
            [column]: Math.max(60, startWidth + delta)
          }))
        }

        const onMouseUp = () => {
          document.removeEventListener('mousemove', onMouseMove)
          document.removeEventListener('mouseup', onMouseUp)
        }

        document.addEventListener('mousemove', onMouseMove)
        document.addEventListener('mouseup', onMouseUp)
      }}
    />
  )

  return (
    <>
      <div className="overflow-auto max-h-[600px]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                style={{ width: columnWidths.product_code, position: 'relative' }}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => toggleSort('product_code')}
              >
                품목코드 <SortIcon field="product_code" />
                <ResizeHandle column="product_code" />
              </TableHead>
              <TableHead style={{ width: columnWidths.product_name, position: 'relative' }}>
                품목명
                <ResizeHandle column="product_name" />
              </TableHead>
              <TableHead
                style={{ width: columnWidths.brand, position: 'relative' }}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => toggleSort('brand')}
              >
                브랜드 <SortIcon field="brand" />
                <ResizeHandle column="brand" />
              </TableHead>
              <TableHead style={{ width: columnWidths.stock, position: 'relative' }} className="text-right">
                현재고
                <ResizeHandle column="stock" />
              </TableHead>
              <TableHead style={{ width: columnWidths.confirmed, position: 'relative' }} className="text-right">
                출고예정
                <ResizeHandle column="confirmed" />
              </TableHead>
              <TableHead style={{ width: columnWidths.status, position: 'relative' }}>
                상태
                <ResizeHandle column="status" />
              </TableHead>
              <TableHead style={{ width: columnWidths.lot, position: 'relative' }}>
                LOT 구성 (FIFO)
                <ResizeHandle column="lot" />
              </TableHead>
              <TableHead className="text-center w-[80px]">관리</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sortedInventory.map(item => {
              const ruProduct = productMap.get(item.product_id)
              const status = getStockStatus(item.bal_qty || 0)
              const lotInfo = lotMap.get(item.product_id)
              const confirmedQty = confirmedQtyMap.get(item.product_id) || 0

              return (
                <TableRow key={item.product_id}>
                  <TableCell className="font-mono text-sm">{item.product_id}</TableCell>
                  <TableCell>
                    <div className="font-medium">{ruProduct?.name_ko || '-'}</div>
                    <div className="text-xs text-muted-foreground truncate">{item.name}</div>
                  </TableCell>
                  <TableCell>{ruProduct?.brand || '-'}</TableCell>
                  <TableCell className="text-right font-bold text-lg">
                    {(item.bal_qty || 0).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    {confirmedQty > 0 ? (
                      <span className="font-medium text-orange-600">{confirmedQty.toLocaleString()}</span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge className={status.color}>{status.label}</Badge>
                  </TableCell>
                  <TableCell>
                    {lotInfo && lotInfo.lot_numbers && lotInfo.lot_numbers.length > 0 ? (
                      <div className="space-y-0.5">
                        {/* LOT 테이블 헤더 */}
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground border-b pb-0.5 mb-0.5">
                          <span className="w-16">LOT</span>
                          <span className="w-16 text-center">제조일</span>
                          <span className="w-12 text-center">잔여월</span>
                          <span className="w-14 text-right">수량</span>
                        </div>
                        {lotInfo.lot_numbers
                          .map((lot: string, idx: number) => ({
                            lot,
                            qty: lotInfo.remaining_quantities?.[idx] || 0,
                            status: lotInfo.lot_statuses?.[idx] || 'active'
                          }))
                          .filter(item => item.status !== 'depleted' && item.qty > 0)
                          .map(({ lot, qty }, lotIdx) => {
                            const mfgDate = lotDateMap.get(lot)
                            const remainMonths = calcRemainMonths(mfgDate)
                            return (
                              <div key={`${lot}-${lotIdx}`} className="flex items-center gap-1 text-xs">
                                <span className="font-mono bg-muted px-1 rounded w-16 truncate">{lot}</span>
                                <span className="w-16 text-center text-blue-600">{formatMfgDate(mfgDate)}</span>
                                <span className={`w-12 text-center ${remainMonths != null && remainMonths < 12 ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>
                                  {remainMonths != null ? `${remainMonths}M` : '-'}
                                </span>
                                <span className="w-14 text-right text-green-600 font-medium">
                                  {qty.toLocaleString()}
                                </span>
                              </div>
                            )
                          })}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-xs">LOT 정보 없음</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openLotEditor(item.product_id, ruProduct?.name_ko || item.name)}
                    >
                      편집
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
            {sortedInventory.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  재고 데이터가 없습니다.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* LOT 편집 다이얼로그 */}
      <Dialog open={!!editingLot} onOpenChange={() => setEditingLot(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>LOT 정보 편집</DialogTitle>
          </DialogHeader>

          {editingLot && (
            <div className="space-y-4">
              <div className="bg-muted p-3 rounded">
                <div className="font-mono text-sm">{editingLot.productId}</div>
                <div className="text-sm text-muted-foreground">{editingLot.productName}</div>
              </div>

              {/* 기존 LOT 목록 */}
              <div className="space-y-2">
                <Label>LOT 목록</Label>
                {editingLot.lots.length === 0 ? (
                  <div className="text-sm text-muted-foreground py-2">등록된 LOT이 없습니다.</div>
                ) : (
                  editingLot.lots.map((lot, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <Input
                        value={lot.lotNumber}
                        readOnly
                        className="w-32 font-mono text-sm"
                      />
                      <Input
                        type="number"
                        value={lot.qty}
                        onChange={(e) => updateLotQty(idx, parseInt(e.target.value) || 0)}
                        className="w-24"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-red-600"
                        onClick={() => removeLot(idx)}
                      >
                        삭제
                      </Button>
                    </div>
                  ))
                )}
              </div>

              {/* 새 LOT 추가 */}
              <div className="border-t pt-4">
                <Label>새 LOT 추가</Label>
                <div className="flex items-center gap-2 mt-2">
                  <Input
                    placeholder="LOT 번호"
                    value={newLot.lotNumber}
                    onChange={(e) => setNewLot(prev => ({ ...prev, lotNumber: e.target.value }))}
                    className="w-32 font-mono"
                  />
                  <Input
                    type="number"
                    placeholder="수량"
                    value={newLot.qty || ''}
                    onChange={(e) => setNewLot(prev => ({ ...prev, qty: parseInt(e.target.value) || 0 }))}
                    className="w-24"
                  />
                  <Button variant="outline" size="sm" onClick={addLot}>
                    추가
                  </Button>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingLot(null)}>취소</Button>
            <Button onClick={saveLots} disabled={saving}>
              {saving ? '저장 중...' : '저장'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
