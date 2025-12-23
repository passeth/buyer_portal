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
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Product, Price } from '@/types'

interface ProductsTableProps {
  products: (Product & { price?: Price })[]
  brands: string[]
}

type SortField = 'product_code' | 'brand' | 'name_ko' | 'pcs_per_carton' | 'final_price'
type SortDirection = 'asc' | 'desc'

export function ProductsTable({ products, brands }: ProductsTableProps) {
  const [search, setSearch] = useState('')
  const [brandFilter, setBrandFilter] = useState<string>('all')
  const [sortField, setSortField] = useState<SortField>('product_code')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')

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
    if (sortField !== field) {
      return <span className="text-muted-foreground/50 ml-1">↕</span>
    }
    return <span className="ml-1">{sortDirection === 'asc' ? '↑' : '↓'}</span>
  }

  // 필터링 및 정렬
  const filteredProducts = useMemo(() => {
    let filtered = products.filter(product => {
      const matchesSearch =
        product.product_code.toLowerCase().includes(search.toLowerCase()) ||
        product.name_ko.toLowerCase().includes(search.toLowerCase()) ||
        (product.name_en && product.name_en.toLowerCase().includes(search.toLowerCase())) ||
        (product.barcode && product.barcode.includes(search)) ||
        (product.hscode && product.hscode.includes(search))

      const matchesBrand = brandFilter === 'all' || product.brand === brandFilter

      return matchesSearch && matchesBrand
    })

    // 정렬
    filtered.sort((a, b) => {
      let aVal: string | number = ''
      let bVal: string | number = ''

      switch (sortField) {
        case 'product_code':
          aVal = a.product_code
          bVal = b.product_code
          break
        case 'brand':
          aVal = a.brand || ''
          bVal = b.brand || ''
          break
        case 'name_ko':
          aVal = a.name_ko
          bVal = b.name_ko
          break
        case 'pcs_per_carton':
          aVal = a.pcs_per_carton
          bVal = b.pcs_per_carton
          break
        case 'final_price':
          aVal = a.price?.final_price || 0
          bVal = b.price?.final_price || 0
          break
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

    return filtered
  }, [products, search, brandFilter, sortField, sortDirection])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR').format(price)
  }

  return (
    <div className="space-y-4">
      {/* 필터 및 액션 */}
      <div className="flex justify-between items-start gap-4 flex-wrap">
        <div className="flex gap-4 flex-wrap">
          <Input
            placeholder="품목코드, 품목명, 바코드, HS코드 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-[300px]"
          />

          <Select value={brandFilter} onValueChange={setBrandFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="브랜드 선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 브랜드</SelectItem>
              {brands.map(brand => (
                <SelectItem key={brand} value={brand}>
                  {brand}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="text-sm text-muted-foreground self-center">
            {filteredProducts.length}개 결과
          </div>
        </div>

        <Link href="/products/new">
          <Button>+ 신제품 등록</Button>
        </Link>
      </div>

      {/* 테이블 */}
      <div className="border rounded-lg overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                className="w-[100px] cursor-pointer hover:bg-muted"
                onClick={() => toggleSort('product_code')}
              >
                품목코드 <SortIcon field="product_code" />
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted"
                onClick={() => toggleSort('brand')}
              >
                브랜드 <SortIcon field="brand" />
              </TableHead>
              <TableHead
                className="cursor-pointer hover:bg-muted"
                onClick={() => toggleSort('name_ko')}
              >
                품목명 <SortIcon field="name_ko" />
              </TableHead>
              <TableHead>바코드</TableHead>
              <TableHead className="text-center">용량</TableHead>
              <TableHead
                className="text-center cursor-pointer hover:bg-muted"
                onClick={() => toggleSort('pcs_per_carton')}
              >
                입수량 <SortIcon field="pcs_per_carton" />
              </TableHead>
              <TableHead className="text-right">본사가</TableHead>
              <TableHead className="text-right">커미션</TableHead>
              <TableHead
                className="text-right cursor-pointer hover:bg-muted"
                onClick={() => toggleSort('final_price')}
              >
                최종가 <SortIcon field="final_price" />
              </TableHead>
              <TableHead>HS코드</TableHead>
              <TableHead className="text-center">관리</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                  제품이 없습니다.
                </TableCell>
              </TableRow>
            ) : (
              filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-mono font-medium text-sm">
                    {product.product_code}
                  </TableCell>
                  <TableCell className="text-sm">
                    {product.brand || '-'}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium text-sm">{product.name_ko}</div>
                      {product.name_en && (
                        <div className="text-xs text-muted-foreground">{product.name_en}</div>
                      )}
                      {product.name_ru && (
                        <div className="text-xs text-muted-foreground">{product.name_ru}</div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {product.barcode || '-'}
                  </TableCell>
                  <TableCell className="text-center text-sm">
                    {product.volume || '-'}
                  </TableCell>
                  <TableCell className="text-center">
                    {product.pcs_per_carton}
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {product.price?.supply_price
                      ? `₩${formatPrice(product.price.supply_price)}`
                      : '-'}
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {product.price?.commission
                      ? `₩${formatPrice(product.price.commission)}`
                      : '-'}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {product.price?.final_price
                      ? `₩${formatPrice(product.price.final_price)}`
                      : '-'}
                  </TableCell>
                  <TableCell className="font-mono text-xs">
                    {product.hscode || '-'}
                  </TableCell>
                  <TableCell className="text-center">
                    <Link href={`/products/${product.id}/edit`}>
                      <Button variant="ghost" size="sm">
                        수정
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
