'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useToast } from '@/hooks/use-toast'
import type { Product, Price } from '@/types'

interface ProductFormProps {
  product?: Product & { price?: Price }
  brands: string[]
  mode: 'create' | 'edit'
}

export function ProductForm({ product, brands, mode }: ProductFormProps) {
  const router = useRouter()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 폼 상태
  const [formData, setFormData] = useState({
    product_code: product?.product_code || '',
    name_ko: product?.name_ko || '',
    name_en: product?.name_en || '',
    name_ru: product?.name_ru || '',
    barcode: product?.barcode || '',
    brand: product?.brand || '',
    category: product?.category || '',
    volume: product?.volume || '',
    pcs_per_carton: product?.pcs_per_carton || 1,
    width_cm: product?.width_cm || '',
    height_cm: product?.height_cm || '',
    depth_cm: product?.depth_cm || '',
    weight_kg: product?.weight_kg || '',
    hscode: product?.hscode || '',
    status: product?.status || 'active',
    remarks: product?.remarks || '',
    // 가격 정보
    supply_price: product?.price?.supply_price || 0,
    commission: product?.price?.commission || 0,
    final_price: product?.price?.final_price || 0,
  })

  const handleChange = (field: string, value: string | number) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value }

      // 가격 자동 계산
      if (field === 'supply_price' || field === 'commission') {
        const supply = field === 'supply_price' ? Number(value) : prev.supply_price
        const commission = field === 'commission' ? Number(value) : prev.commission
        updated.final_price = supply + commission
      }

      return updated
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // 필수 필드 검증
    if (!formData.product_code || !formData.name_ko) {
      toast({
        title: '필수 항목 누락',
        description: '품목코드와 품목명(한글)은 필수입니다.',
        variant: 'destructive'
      })
      return
    }

    setIsSubmitting(true)

    try {
      const url = mode === 'create'
        ? '/api/products'
        : `/api/products/${product?.id}`

      const method = mode === 'create' ? 'POST' : 'PATCH'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || '저장 실패')
      }

      toast({
        title: mode === 'create' ? '제품 등록 완료' : '제품 수정 완료',
        description: `품목코드: ${formData.product_code}`,
      })

      router.push('/products')
      router.refresh()
    } catch (error) {
      console.error('Product save error:', error)
      toast({
        title: '저장 실패',
        description: error instanceof Error ? error.message : '알 수 없는 오류',
        variant: 'destructive'
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 기본 정보 */}
      <Card>
        <CardHeader>
          <CardTitle>기본 정보</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="product_code">품목코드 *</Label>
            <Input
              id="product_code"
              value={formData.product_code}
              onChange={(e) => handleChange('product_code', e.target.value)}
              disabled={mode === 'edit'}
              placeholder="예: EV-001"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="barcode">바코드</Label>
            <Input
              id="barcode"
              value={formData.barcode}
              onChange={(e) => handleChange('barcode', e.target.value)}
              placeholder="8809..."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="brand">브랜드</Label>
            <Select
              value={formData.brand}
              onValueChange={(value) => handleChange('brand', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="브랜드 선택" />
              </SelectTrigger>
              <SelectContent>
                {brands.map(brand => (
                  <SelectItem key={brand} value={brand}>
                    {brand}
                  </SelectItem>
                ))}
                <SelectItem value="__new__">+ 새 브랜드 입력</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">카테고리</Label>
            <Input
              id="category"
              value={formData.category}
              onChange={(e) => handleChange('category', e.target.value)}
              placeholder="스킨케어, 메이크업 등"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="volume">용량</Label>
            <Input
              id="volume"
              value={formData.volume}
              onChange={(e) => handleChange('volume', e.target.value)}
              placeholder="100ml"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">상태</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => handleChange('status', value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">활성</SelectItem>
                <SelectItem value="inactive">비활성</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 품목명 */}
      <Card>
        <CardHeader>
          <CardTitle>품목명</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name_ko">한글명 *</Label>
            <Input
              id="name_ko"
              value={formData.name_ko}
              onChange={(e) => handleChange('name_ko', e.target.value)}
              placeholder="제품명 (한글)"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="name_en">영문명</Label>
            <Input
              id="name_en"
              value={formData.name_en}
              onChange={(e) => handleChange('name_en', e.target.value)}
              placeholder="Product Name (English)"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="name_ru">러시아어명</Label>
            <Input
              id="name_ru"
              value={formData.name_ru}
              onChange={(e) => handleChange('name_ru', e.target.value)}
              placeholder="Название продукта"
            />
          </div>
        </CardContent>
      </Card>

      {/* 포장/규격 정보 */}
      <Card>
        <CardHeader>
          <CardTitle>포장/규격 정보</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          <div className="space-y-2">
            <Label htmlFor="pcs_per_carton">입수량 (EA/CTN)</Label>
            <Input
              id="pcs_per_carton"
              type="number"
              min="1"
              value={formData.pcs_per_carton}
              onChange={(e) => handleChange('pcs_per_carton', parseInt(e.target.value) || 1)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="width_cm">가로 (cm)</Label>
            <Input
              id="width_cm"
              type="number"
              step="0.1"
              value={formData.width_cm}
              onChange={(e) => handleChange('width_cm', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="height_cm">세로 (cm)</Label>
            <Input
              id="height_cm"
              type="number"
              step="0.1"
              value={formData.height_cm}
              onChange={(e) => handleChange('height_cm', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="depth_cm">높이 (cm)</Label>
            <Input
              id="depth_cm"
              type="number"
              step="0.1"
              value={formData.depth_cm}
              onChange={(e) => handleChange('depth_cm', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="weight_kg">중량 (kg)</Label>
            <Input
              id="weight_kg"
              type="number"
              step="0.001"
              value={formData.weight_kg}
              onChange={(e) => handleChange('weight_kg', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      {/* 가격 정보 */}
      <Card>
        <CardHeader>
          <CardTitle>가격 정보</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="supply_price">본사가 (₩)</Label>
            <Input
              id="supply_price"
              type="number"
              min="0"
              value={formData.supply_price}
              onChange={(e) => handleChange('supply_price', parseInt(e.target.value) || 0)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="commission">커미션 (₩)</Label>
            <Input
              id="commission"
              type="number"
              min="0"
              value={formData.commission}
              onChange={(e) => handleChange('commission', parseInt(e.target.value) || 0)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="final_price">최종가 (₩)</Label>
            <Input
              id="final_price"
              type="number"
              value={formData.final_price}
              disabled
              className="bg-muted"
            />
            <p className="text-xs text-muted-foreground">본사가 + 커미션 자동 계산</p>
          </div>
        </CardContent>
      </Card>

      {/* 추가 정보 */}
      <Card>
        <CardHeader>
          <CardTitle>추가 정보</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="hscode">HS코드</Label>
            <Input
              id="hscode"
              value={formData.hscode}
              onChange={(e) => handleChange('hscode', e.target.value)}
              placeholder="3304.99"
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="remarks">비고</Label>
            <Textarea
              id="remarks"
              value={formData.remarks}
              onChange={(e) => handleChange('remarks', e.target.value)}
              placeholder="추가 메모..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* 액션 버튼 */}
      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push('/products')}
          disabled={isSubmitting}
        >
          취소
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? '저장 중...' : (mode === 'create' ? '제품 등록' : '수정 저장')}
        </Button>
      </div>
    </form>
  )
}
