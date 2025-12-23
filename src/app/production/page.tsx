import { createAdminClient } from '@/lib/supabase/admin'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

export const dynamic = 'force-dynamic'

async function getProduction() {
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('ru_production')
    .select('*')
    .order('planned_date', { ascending: true })

  if (error) {
    console.error('Error fetching production:', error)
    return []
  }

  return data || []
}

async function getProducts() {
  const supabase = createAdminClient()

  const { data } = await supabase
    .from('ru_products')
    .select('product_code, name_ko, brand')
    .eq('status', 'active')

  return new Map((data || []).map(p => [p.product_code, p]))
}

const statusLabels: Record<string, { label: string; color: string }> = {
  scheduled: { label: '예정', color: 'bg-blue-100 text-blue-700' },
  in_progress: { label: '진행중', color: 'bg-yellow-100 text-yellow-700' },
  completed: { label: '완료', color: 'bg-green-100 text-green-700' },
  cancelled: { label: '취소', color: 'bg-red-100 text-red-700' },
}

export default async function ProductionPage() {
  const [production, productMap] = await Promise.all([
    getProduction(),
    getProducts()
  ])

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('ko-KR')
  }

  // 통계
  const scheduledCount = production.filter(p => p.status === 'scheduled').length
  const inProgressCount = production.filter(p => p.status === 'in_progress').length
  const completedCount = production.filter(p => p.status === 'completed').length
  const totalPlannedQty = production
    .filter(p => p.status !== 'cancelled')
    .reduce((sum, p) => sum + (p.planned_qty || 0), 0)

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">생산 일정</h1>
        <p className="text-muted-foreground mt-2">
          생산 계획 및 현황 (조회 전용)
        </p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-blue-600">{scheduledCount}</div>
            <div className="text-sm text-muted-foreground">예정</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-yellow-600">{inProgressCount}</div>
            <div className="text-sm text-muted-foreground">진행중</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold text-green-600">{completedCount}</div>
            <div className="text-sm text-muted-foreground">완료</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{totalPlannedQty.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">총 예정 수량</div>
          </CardContent>
        </Card>
      </div>

      {/* 생산 일정 테이블 */}
      <Card>
        <CardHeader>
          <CardTitle>생산 일정 목록</CardTitle>
          <CardDescription>
            {production.length}개 일정
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>생산예정일</TableHead>
                <TableHead>품목코드</TableHead>
                <TableHead>제품명</TableHead>
                <TableHead>브랜드</TableHead>
                <TableHead className="text-right">예정수량</TableHead>
                <TableHead>상태</TableHead>
                <TableHead>비고</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {production.map(item => {
                const product = productMap.get(item.product_code)
                const status = statusLabels[item.status] || { label: item.status, color: 'bg-gray-100' }

                return (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">
                      {formatDate(item.planned_date)}
                    </TableCell>
                    <TableCell className="font-mono">{item.product_code}</TableCell>
                    <TableCell>{product?.name_ko || '-'}</TableCell>
                    <TableCell>{product?.brand || '-'}</TableCell>
                    <TableCell className="text-right font-medium">
                      {(item.planned_qty || 0).toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <Badge className={status.color}>{status.label}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {item.remarks || '-'}
                    </TableCell>
                  </TableRow>
                )
              })}
              {production.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    생산 일정 데이터가 없습니다.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
