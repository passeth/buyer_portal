import { createAdminClient } from '@/lib/supabase/admin'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PackingListTable } from '@/components/packing/PackingListTable'

export const dynamic = 'force-dynamic'

async function getPackingLists() {
  const supabase = createAdminClient()

  const { data: packingLists, error } = await supabase
    .from('ru_packing_lists')
    .select(`
      *,
      ru_orders!inner (
        order_number,
        buyer_name,
        status
      )
    `)
    .order('created_date', { ascending: false })

  if (error) {
    console.error('Error fetching packing lists:', error)
    return []
  }

  return packingLists || []
}

async function getStats() {
  const supabase = createAdminClient()

  const { data: packingLists } = await supabase
    .from('ru_packing_lists')
    .select('total_pallets, total_nw_kg, total_gw_kg, total_cbm, total_amount')

  const stats = {
    total: packingLists?.length || 0,
    totalPallets: packingLists?.reduce((sum, pl) => sum + (pl.total_pallets || 0), 0) || 0,
    totalNwKg: packingLists?.reduce((sum, pl) => sum + (pl.total_nw_kg || 0), 0) || 0,
    totalGwKg: packingLists?.reduce((sum, pl) => sum + (pl.total_gw_kg || 0), 0) || 0,
    totalCbm: packingLists?.reduce((sum, pl) => sum + (pl.total_cbm || 0), 0) || 0,
    totalAmount: packingLists?.reduce((sum, pl) => sum + (pl.total_amount || 0), 0) || 0,
  }

  return stats
}

export default async function PackingListsPage() {
  const [packingLists, stats] = await Promise.all([
    getPackingLists(),
    getStats()
  ])

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('ko-KR').format(price)
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">패킹리스트</h1>
        <p className="text-muted-foreground mt-2">
          생성된 패킹리스트 조회
        </p>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-sm text-muted-foreground">총 P/L</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{stats.totalPallets}</div>
            <div className="text-sm text-muted-foreground">총 팔레트</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{stats.totalNwKg.toFixed(1)}</div>
            <div className="text-sm text-muted-foreground">N/W(kg)</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{stats.totalGwKg.toFixed(1)}</div>
            <div className="text-sm text-muted-foreground">G/W(kg)</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">{stats.totalCbm.toFixed(2)}</div>
            <div className="text-sm text-muted-foreground">CBM</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="text-2xl font-bold">₩{formatPrice(stats.totalAmount)}</div>
            <div className="text-sm text-muted-foreground">총 금액</div>
          </CardContent>
        </Card>
      </div>

      {/* 패킹리스트 테이블 */}
      <Card>
        <CardHeader>
          <CardTitle>패킹리스트 목록</CardTitle>
        </CardHeader>
        <CardContent>
          <PackingListTable packingLists={packingLists} />
        </CardContent>
      </Card>
    </div>
  )
}
