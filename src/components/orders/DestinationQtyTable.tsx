'use client'

import { useState, useMemo, useEffect } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'

interface ProductGroup {
  product_code: string
  product_name: string
  unit_price: number
  supply_price: number
  commission: number
  byDestination: Map<string, { qty: number; subtotal: number }>
  totalQty: number
  totalSubtotal: number
}

interface DestinationQtyTableProps {
  productGroups: ProductGroup[]
  destinations: string[]
  destinationTotals: Map<string, { qty: number; amount: number }>
  totalQty: number
  totalAmount: number
  initialDestinationFilter?: string
}

type SortField = 'product_code' | 'product_name' | 'totalQty' | 'totalSubtotal' | string
type SortDirection = 'asc' | 'desc'

export function DestinationQtyTable({
  productGroups,
  destinations,
  destinationTotals,
  totalQty,
  totalAmount,
  initialDestinationFilter
}: DestinationQtyTableProps) {
  const [sortField, setSortField] = useState<SortField>('product_code')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [destinationFilter, setDestinationFilter] = useState<string | null>(initialDestinationFilter || null)

  useEffect(() => {
    if (initialDestinationFilter) {
      setDestinationFilter(initialDestinationFilter)
    }
  }, [initialDestinationFilter])

  const allDestinations = destinations.length > 0 ? destinations : ['미지정']

  // Filter destinations based on selection
  const visibleDestinations = destinationFilter
    ? allDestinations.filter(d => d === destinationFilter)
    : allDestinations

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR').format(amount)
  }

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <span className="text-muted-foreground/50 ml-1 text-xs">↕</span>
    }
    return <span className="ml-1 text-xs">{sortDirection === 'asc' ? '↑' : '↓'}</span>
  }

  // Filter and sort product groups based on destination filter
  const sortedGroups = useMemo(() => {
    let groups = [...productGroups]

    // If filtering by destination, only show products with data for that destination
    if (destinationFilter) {
      groups = groups.filter(g => {
        const destData = g.byDestination.get(destinationFilter)
        return destData && destData.qty > 0
      })
    }

    groups.sort((a, b) => {
      let aVal: string | number
      let bVal: string | number

      // Check if sorting by destination
      if (sortField.startsWith('dest_')) {
        const dest = sortField.replace('dest_', '')
        aVal = a.byDestination.get(dest)?.qty || 0
        bVal = b.byDestination.get(dest)?.qty || 0
      } else {
        switch (sortField) {
          case 'product_code':
            aVal = a.product_code
            bVal = b.product_code
            break
          case 'product_name':
            aVal = a.product_name
            bVal = b.product_name
            break
          case 'totalQty':
            aVal = a.totalQty
            bVal = b.totalQty
            break
          case 'totalSubtotal':
            aVal = a.totalSubtotal
            bVal = b.totalSubtotal
            break
          default:
            aVal = a.product_code
            bVal = b.product_code
        }
      }

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDirection === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal)
      }

      return sortDirection === 'asc'
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number)
    })

    return groups
  }, [productGroups, sortField, sortDirection, destinationFilter])

  // Calculate filtered totals
  const filteredTotalQty = destinationFilter
    ? destinationTotals.get(destinationFilter)?.qty || 0
    : totalQty

  const filteredTotalAmount = destinationFilter
    ? destinationTotals.get(destinationFilter)?.amount || 0
    : totalAmount

  return (
    <div className="space-y-4">
      {/* Destination filter buttons */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={destinationFilter === null ? "default" : "outline"}
          size="sm"
          onClick={() => setDestinationFilter(null)}
        >
          전체
        </Button>
        {allDestinations.map(dest => (
          <Button
            key={dest}
            variant={destinationFilter === dest ? "default" : "outline"}
            size="sm"
            onClick={() => setDestinationFilter(dest)}
          >
            {dest.split(' ')[0]}
          </Button>
        ))}
      </div>

      <div className="overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead
              className="sticky left-0 bg-background cursor-pointer hover:bg-muted"
              onClick={() => toggleSort('product_code')}
            >
              품목코드 <SortIcon field="product_code" />
            </TableHead>
            <TableHead
              className="sticky left-[100px] bg-background cursor-pointer hover:bg-muted"
              onClick={() => toggleSort('product_name')}
            >
              품목명 <SortIcon field="product_name" />
            </TableHead>
            {visibleDestinations.map(dest => (
              <TableHead
                key={dest}
                className="text-center min-w-[100px] cursor-pointer hover:bg-muted"
                onClick={() => toggleSort(`dest_${dest}`)}
              >
                {dest.split(' ')[0]} <SortIcon field={`dest_${dest}`} />
              </TableHead>
            ))}
            <TableHead
              className="text-center font-bold bg-muted cursor-pointer hover:bg-muted/80"
              onClick={() => toggleSort('totalQty')}
            >
              합계 <SortIcon field="totalQty" />
            </TableHead>
            <TableHead className="text-right">단가</TableHead>
            <TableHead
              className="text-right font-bold bg-muted cursor-pointer hover:bg-muted/80"
              onClick={() => toggleSort('totalSubtotal')}
            >
              금액 <SortIcon field="totalSubtotal" />
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedGroups.map(group => (
            <TableRow key={group.product_code}>
              <TableCell className="font-mono sticky left-0 bg-background">
                {group.product_code}
              </TableCell>
              <TableCell className="sticky left-[100px] bg-background max-w-[150px] truncate">
                {group.product_name || '-'}
              </TableCell>
              {visibleDestinations.map(dest => {
                const destData = group.byDestination.get(dest)
                return (
                  <TableCell key={dest} className="text-center">
                    {destData ? destData.qty.toLocaleString() : '-'}
                  </TableCell>
                )
              })}
              <TableCell className="text-center font-bold bg-muted">
                {group.totalQty.toLocaleString()}
              </TableCell>
              <TableCell className="text-right">
                ₩{formatCurrency(group.unit_price)}
              </TableCell>
              <TableCell className="text-right font-bold bg-muted">
                ₩{formatCurrency(group.totalSubtotal)}
              </TableCell>
            </TableRow>
          ))}

          {/* 목적지별 합계 행 */}
          <TableRow className="bg-muted/70 font-bold border-t-2">
            <TableCell className="sticky left-0 bg-muted/70" colSpan={2}>
              {destinationFilter ? `${destinationFilter.split(' ')[0]} 합계` : '목적지별 합계'}
            </TableCell>
            {visibleDestinations.map(dest => {
              const total = destinationTotals.get(dest)
              return (
                <TableCell key={dest} className="text-center">
                  {total ? total.qty.toLocaleString() : '-'}
                </TableCell>
              )
            })}
            <TableCell className="text-center bg-primary/10">
              {filteredTotalQty.toLocaleString()}
            </TableCell>
            <TableCell></TableCell>
            <TableCell className="text-right bg-primary/10">
              ₩{formatCurrency(filteredTotalAmount)}
            </TableCell>
          </TableRow>

          {/* 목적지별 금액 행 */}
          <TableRow className="bg-muted/50 text-sm">
            <TableCell className="sticky left-0 bg-muted/50" colSpan={2}>
              {destinationFilter ? `${destinationFilter.split(' ')[0]} 금액` : '목적지별 금액'}
            </TableCell>
            {visibleDestinations.map(dest => {
              const total = destinationTotals.get(dest)
              return (
                <TableCell key={dest} className="text-center text-xs">
                  {total ? `₩${formatCurrency(total.amount)}` : '-'}
                </TableCell>
              )
            })}
            <TableCell colSpan={3}></TableCell>
          </TableRow>
        </TableBody>
      </Table>
      </div>
    </div>
  )
}
