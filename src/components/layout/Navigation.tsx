'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'

// 역할별 네비게이션 구조
const navStructure = {
  buyer: {
    label: '바이어',
    items: [
      { href: '/buyer', label: '대시보드' },
      { href: '/orders/new', label: '발주서 작성' },
    ]
  },
  manager: {
    label: '매니저',
    items: [
      { href: '/manager', label: '대시보드' },
      { href: '/orders', label: '발주 관리' },
      { href: '/products', label: '제품 관리' },
    ]
  },
  supplier: {
    label: '에바스',
    items: [
      { href: '/supplier', label: '대시보드' },
      { href: '/inventory', label: '재고 현황' },
      { href: '/packing', label: '패킹리스트' },
    ]
  }
}

export function Navigation() {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <header className="border-b bg-white">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="text-xl font-bold text-primary">
              RUboard
            </Link>

            <nav className="flex items-center gap-1">
              {/* 역할별 드롭다운 메뉴 */}
              {Object.entries(navStructure).map(([key, section]) => (
                <DropdownMenu key={key}>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      className={cn(
                        'px-3',
                        section.items.some(item => isActive(item.href)) && 'bg-muted'
                      )}
                    >
                      {section.label}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    <DropdownMenuLabel>{section.label} 메뉴</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {section.items.map((item) => (
                      <DropdownMenuItem key={item.href} asChild>
                        <Link
                          href={item.href}
                          className={cn(
                            'w-full cursor-pointer',
                            isActive(item.href) && 'bg-muted'
                          )}
                        >
                          {item.label}
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              ))}

              {/* 빠른 접근 링크 */}
              <div className="ml-4 flex gap-2 border-l pl-4">
                <Link
                  href="/orders"
                  className={cn(
                    'text-sm font-medium transition-colors hover:text-primary px-2 py-1 rounded',
                    isActive('/orders') ? 'text-primary bg-muted' : 'text-muted-foreground'
                  )}
                >
                  발주
                </Link>
                <Link
                  href="/products"
                  className={cn(
                    'text-sm font-medium transition-colors hover:text-primary px-2 py-1 rounded',
                    isActive('/products') ? 'text-primary bg-muted' : 'text-muted-foreground'
                  )}
                >
                  제품
                </Link>
              </div>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700">
              Demo Mode
            </span>
          </div>
        </div>
      </div>
    </header>
  )
}
