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

interface PackingList {
  pl_number: string
  order_id: string
  consignee_name?: string
  destination?: string
  total_qty?: number
  total_cartons?: number
  total_pallets?: number
  total_nw_kg?: number
  total_gw_kg?: number
  total_cbm?: number
  total_amount?: number
  created_date?: string
  ru_orders?: {
    order_number: string
    buyer_name?: string
    status?: string
  }
}

interface PackingListTableProps {
  packingLists: PackingList[]
}

type SortField = 'pl_number' | 'order_number' | 'consignee' | 'total_pallets' | 'total_nw_kg' | 'total_gw_kg' | 'total_cbm' | 'total_amount' | 'created_date'
type SortDirection = 'asc' | 'desc'

export function PackingListTable({ packingLists }: PackingListTableProps) {
  const [sortField, setSortField] = useState<SortField>('created_date')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  const formatPrice = (price: number) => new Intl.NumberFormat('ko-KR').format(price)

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('ko-KR')
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

  const sortedList = useMemo(() => {
    const list = [...packingLists]

    list.sort((a, b) => {
      let aVal: string | number
      let bVal: string | number

      switch (sortField) {
        case 'pl_number':
          aVal = a.pl_number
          bVal = b.pl_number
          break
        case 'order_number':
          aVal = a.ru_orders?.order_number || a.order_id
          bVal = b.ru_orders?.order_number || b.order_id
          break
        case 'consignee':
          aVal = a.consignee_name || ''
          bVal = b.consignee_name || ''
          break
        case 'total_pallets':
          aVal = a.total_pallets || 0
          bVal = b.total_pallets || 0
          break
        case 'total_nw_kg':
          aVal = a.total_nw_kg || 0
          bVal = b.total_nw_kg || 0
          break
        case 'total_gw_kg':
          aVal = a.total_gw_kg || 0
          bVal = b.total_gw_kg || 0
          break
        case 'total_cbm':
          aVal = a.total_cbm || 0
          bVal = b.total_cbm || 0
          break
        case 'total_amount':
          aVal = a.total_amount || 0
          bVal = b.total_amount || 0
          break
        case 'created_date':
          aVal = a.created_date || ''
          bVal = b.created_date || ''
          break
        default:
          aVal = a.pl_number
          bVal = b.pl_number
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

    return list
  }, [packingLists, sortField, sortDirection])

  if (packingLists.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        생성된 패킹리스트가 없습니다.
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead
            className="cursor-pointer hover:bg-muted"
            onClick={() => toggleSort('pl_number')}
          >
            PL번호 <SortIcon field="pl_number" />
          </TableHead>
          <TableHead
            className="cursor-pointer hover:bg-muted"
            onClick={() => toggleSort('order_number')}
          >
            발주번호 <SortIcon field="order_number" />
          </TableHead>
          <TableHead
            className="cursor-pointer hover:bg-muted"
            onClick={() => toggleSort('consignee')}
          >
            Consignee <SortIcon field="consignee" />
          </TableHead>
          <TableHead
            className="text-right cursor-pointer hover:bg-muted"
            onClick={() => toggleSort('total_pallets')}
          >
            PLT <SortIcon field="total_pallets" />
          </TableHead>
          <TableHead
            className="text-right cursor-pointer hover:bg-muted"
            onClick={() => toggleSort('total_nw_kg')}
          >
            N/W(kg) <SortIcon field="total_nw_kg" />
          </TableHead>
          <TableHead
            className="text-right cursor-pointer hover:bg-muted"
            onClick={() => toggleSort('total_gw_kg')}
          >
            G/W(kg) <SortIcon field="total_gw_kg" />
          </TableHead>
          <TableHead
            className="text-right cursor-pointer hover:bg-muted"
            onClick={() => toggleSort('total_cbm')}
          >
            CBM <SortIcon field="total_cbm" />
          </TableHead>
          <TableHead
            className="text-right cursor-pointer hover:bg-muted"
            onClick={() => toggleSort('total_amount')}
          >
            금액 <SortIcon field="total_amount" />
          </TableHead>
          <TableHead
            className="cursor-pointer hover:bg-muted"
            onClick={() => toggleSort('created_date')}
          >
            생성일 <SortIcon field="created_date" />
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sortedList.map(pl => (
          <TableRow key={pl.pl_number} className="hover:bg-muted/50">
            <TableCell>
              <Link
                href={`/packing/${pl.pl_number}`}
                className="font-mono font-medium hover:underline text-primary"
              >
                {pl.pl_number}
              </Link>
            </TableCell>
            <TableCell>
              <Link
                href={`/orders/${pl.order_id}`}
                className="font-mono hover:underline"
              >
                {pl.ru_orders?.order_number || pl.order_id}
              </Link>
            </TableCell>
            <TableCell className="max-w-[150px] truncate">
              {pl.consignee_name || '-'}
            </TableCell>
            <TableCell className="text-right">
              {pl.total_pallets || 0}
            </TableCell>
            <TableCell className="text-right">
              {(pl.total_nw_kg || 0).toFixed(2)}
            </TableCell>
            <TableCell className="text-right">
              {(pl.total_gw_kg || 0).toFixed(2)}
            </TableCell>
            <TableCell className="text-right">
              {(pl.total_cbm || 0).toFixed(4)}
            </TableCell>
            <TableCell className="text-right font-medium">
              ₩{formatPrice(pl.total_amount || 0)}
            </TableCell>
            <TableCell>{formatDate(pl.created_date || null)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
