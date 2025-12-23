# RUboard - 구현 Spec

## 1. 프로젝트 구조

```
@ongoing_RUboard/
├── CLAUDE.md                       # 프로젝트 가이드
├── docs/                           # 문서
│   ├── 01_PRD.md
│   ├── 02_DATABASE_SCHEMA.md
│   ├── 03_DATA_FLOW.md
│   ├── 04_FEATURE_SPEC.md
│   └── 05_IMPLEMENTATION.md
│
├── supabase/
│   └── migrations/
│       ├── 100_simplified_schema.sql
│       └── 999_drop_all_ru_tables.sql
│
├── src/
│   ├── app/                        # Next.js App Router
│   │   ├── layout.tsx             # 루트 레이아웃
│   │   ├── page.tsx               # 대시보드 (/)
│   │   ├── products/
│   │   │   └── page.tsx           # 제품 목록 (/products)
│   │   ├── orders/
│   │   │   ├── page.tsx           # 발주 목록 (/orders)
│   │   │   ├── new/
│   │   │   │   └── page.tsx       # 발주 생성 (/orders/new)
│   │   │   └── [id]/
│   │   │       └── page.tsx       # 발주 상세 (/orders/[id])
│   │   ├── inventory/
│   │   │   └── page.tsx           # 재고 현황 (/inventory)
│   │   ├── production/
│   │   │   └── page.tsx           # 생산 일정 (/production)
│   │   └── api/
│   │       ├── products/
│   │       │   └── import/
│   │       │       └── route.ts   # 엑셀 임포트 API
│   │       └── orders/
│   │           └── route.ts       # 발주 API
│   │
│   ├── components/
│   │   ├── ui/                    # shadcn/ui 컴포넌트
│   │   ├── products/
│   │   │   ├── ProductsTable.tsx  # 제품 테이블
│   │   │   └── ExcelImporter.tsx  # 엑셀 임포트
│   │   └── orders/
│   │       ├── OrdersTable.tsx    # 발주 테이블
│   │       ├── OrderForm.tsx      # 발주 폼
│   │       └── ProductSelector.tsx # 제품 선택 모달
│   │
│   ├── lib/
│   │   └── supabase/
│   │       ├── client.ts          # 브라우저 클라이언트
│   │       └── admin.ts           # 서버 Admin 클라이언트
│   │
│   ├── types/
│   │   └── index.ts               # TypeScript 타입 정의
│   │
│   └── hooks/
│       └── use-toast.ts           # Toast 훅
│
├── .env.local                      # 환경변수
├── package.json
├── tsconfig.json
└── tailwind.config.ts
```

---

## 2. 페이지 라우트

| 경로 | 파일 | 설명 | 렌더링 |
|------|------|------|--------|
| `/` | `app/page.tsx` | 대시보드 | Server |
| `/products` | `app/products/page.tsx` | 제품 목록 | Server |
| `/orders` | `app/orders/page.tsx` | 발주 목록 | Server |
| `/orders/new` | `app/orders/new/page.tsx` | 발주 생성 | Client |
| `/orders/[id]` | `app/orders/[id]/page.tsx` | 발주 상세 | Server |
| `/inventory` | `app/inventory/page.tsx` | 재고 현황 | Server |
| `/production` | `app/production/page.tsx` | 생산 일정 | Server |

---

## 3. API 엔드포인트

### 3.1 제품 API

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/products` | 제품 목록 조회 |
| POST | `/api/products/import` | 엑셀 임포트 |

### 3.2 발주 API

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | `/api/orders` | 발주 목록 조회 |
| POST | `/api/orders` | 발주 생성 |
| GET | `/api/orders/[id]` | 발주 상세 조회 |
| PATCH | `/api/orders/[id]` | 발주 수정 |
| DELETE | `/api/orders/[id]` | 발주 삭제 |
| POST | `/api/orders/[id]/confirm` | 발주 확정 |
| POST | `/api/orders/[id]/ship` | 출고 처리 |

---

## 4. 컴포넌트 설계

### 4.1 제품 관련

#### ProductsTable
```typescript
interface ProductsTableProps {
  products: Product[]
  brands: string[]      // 고유 브랜드 목록
  categories: string[]  // 고유 카테고리 목록
}

// 기능
- 필터링 (브랜드, 카테고리, 상태)
- 검색 (품목코드, 제품명, 바코드)
- 페이지네이션
```

#### ExcelImporter
```typescript
// 기능
- 파일 선택 (.xlsx, .xls)
- 헤더 자동 인식 및 매핑
- 유효성 검사
- 미리보기 테이블
- 임포트 실행
```

### 4.2 발주 관련

#### OrdersTable
```typescript
interface OrdersTableProps {
  orders: Order[]
}

// 기능
- 상태 필터
- 정렬
- 상세 페이지 링크
```

#### OrderForm
```typescript
interface OrderFormProps {
  order?: Order          // 수정 모드일 때
  products: Product[]    // 선택 가능한 제품 목록
  onSubmit: (data) => void
}

// 기능
- 제품 검색/추가
- 수량 입력
- 자동 금액 계산
- 제품 삭제
```

#### ProductSelector
```typescript
interface ProductSelectorProps {
  products: Product[]
  selectedItems: OrderItem[]
  onSelect: (product: Product) => void
}

// 기능
- 제품 검색 (품목코드, 제품명)
- 이미 추가된 제품 표시
- 선택 시 부모 컴포넌트에 전달
```

---

## 5. 타입 정의

### 5.1 핵심 타입

```typescript
// 사용자 역할
type UserRole = 'buyer' | 'manager' | 'supplier' | 'admin'

// 발주 상태
type OrderStatus = 'DRAFT' | 'CONFIRMED' | 'PACKING' | 'SHIPPED' | 'COMPLETED' | 'CANCELLED'

// 생산 상태
type ProductionStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
```

### 5.2 데이터 타입

```typescript
interface User {
  id: string
  email: string
  name: string
  role: UserRole
  org_name?: string
  region_code?: string
  is_active: boolean
}

interface Product {
  id: string
  product_code: string
  name_ko: string
  name_en?: string
  name_ru?: string
  barcode?: string
  brand?: string
  category?: string
  pcs_per_carton: number
  status: 'active' | 'inactive'
  // 조인 데이터
  price?: Price
  inventory?: Inventory
}

interface Price {
  id: string
  product_code: string
  base_price: number
  commission: number
  final_price: number
  effective_date: string
}

interface Order {
  id: string
  order_number: string
  buyer_id?: string
  buyer_name?: string
  order_date: string
  status: OrderStatus
  total_qty: number
  total_amount: number
  history: OrderHistoryItem[]
  // 조인 데이터
  items?: OrderItem[]
}

interface OrderItem {
  id: string
  order_id: string
  product_code: string
  product_name?: string
  requested_qty: number
  confirmed_qty?: number
  unit_price: number
  subtotal: number
}

interface OrderHistoryItem {
  date: string
  action: string
  by: string
  changes?: string
}
```

---

## 6. 상태 관리

### 6.1 서버 상태 (Server Components)

대부분의 데이터는 서버 컴포넌트에서 직접 fetch:

```typescript
// app/products/page.tsx
export default async function ProductsPage() {
  const supabase = createAdminClient()

  const { data: products } = await supabase
    .from('ru_products')
    .select('*, ru_prices(*)')
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  return <ProductsTable products={products} />
}
```

### 6.2 클라이언트 상태 (Client Components)

폼 상태 등은 `useState` 사용:

```typescript
// components/orders/OrderForm.tsx
'use client'

export function OrderForm({ products }: OrderFormProps) {
  const [items, setItems] = useState<OrderItem[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // ...
}
```

---

## 7. Supabase 클라이언트

### 7.1 브라우저 클라이언트

```typescript
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

### 7.2 서버 Admin 클라이언트

```typescript
// lib/supabase/admin.ts
import { createClient } from '@supabase/supabase-js'

export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}
```

---

## 8. 구현 우선순위

### Phase 1: 기본 구조 (완료)
- [x] Next.js 프로젝트 설정
- [x] Supabase 연동
- [x] 기본 레이아웃
- [x] 타입 정의

### Phase 2: 제품 관리
- [x] 제품 목록 페이지
- [x] 엑셀 임포트
- [ ] 제품 상세/수정
- [ ] 가격 관리

### Phase 3: 발주 관리
- [x] 발주 목록 페이지
- [ ] 발주 생성 폼
- [ ] 발주 상세 페이지
- [ ] 상태 변경 기능
- [ ] 수량 조정 기능

### Phase 4: 문서 생성
- [ ] 패킹리스트 입력 폼
- [ ] 패킹리스트 PDF
- [ ] 인보이스 PDF

### Phase 5: 보조 기능
- [ ] 재고 현황 페이지
- [ ] 생산 일정 페이지
- [ ] 대시보드 통계

---

## 9. 코딩 가이드라인

### 9.1 서버 vs 클라이언트 컴포넌트

```typescript
// 서버 컴포넌트 (기본)
// - 데이터 fetch
// - 정적 UI
// - SEO 필요한 페이지

// 클라이언트 컴포넌트 ('use client')
// - 이벤트 핸들러 (onClick, onChange)
// - useState, useEffect
// - 브라우저 API 사용
```

### 9.2 에러 핸들링

```typescript
// API Route
export async function POST(request: NextRequest) {
  try {
    // 로직
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '오류 발생' },
      { status: 500 }
    )
  }
}
```

### 9.3 날짜/금액 포맷

```typescript
// 날짜 포맷
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
}

// 금액 포맷
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW',
    maximumFractionDigits: 0
  }).format(amount)
}
```

---

## 10. 테스트 체크리스트

### 제품 관리
- [ ] 제품 목록 표시
- [ ] 브랜드/카테고리 필터 동작
- [ ] 검색 동작
- [ ] 엑셀 파일 파싱
- [ ] 유효성 검사 오류 표시
- [ ] 임포트 성공/실패 처리

### 발주 관리
- [ ] 발주 목록 표시
- [ ] 상태 필터 동작
- [ ] 발주 생성 가능
- [ ] 제품 추가/삭제
- [ ] 수량 입력 및 자동 계산
- [ ] 발주 제출
- [ ] 상태 변경 (DRAFT → CONFIRMED → ...)
- [ ] 이력 기록 확인

### 문서 생성
- [ ] 패킹리스트 정보 입력
- [ ] PDF 생성 및 다운로드
