# Data Migration

> 원본 데이터 → Supabase 테이블 변환

## 폴더 구조

```
data_migration/
├── README.md                    # 이 파일
├── supabase_ready/              # ★ 최종 Import용 CSV
│   ├── ru_products.csv
│   ├── ru_prices.csv
│   ├── ru_orders.csv
│   ├── ru_order_items.csv
│   ├── ru_packing_lists.csv
│   ├── ru_packing_items.csv
│   └── cm_production_lots.csv
├── scripts/
│   ├── clean_csv.py            # 제품/가격 변환
│   ├── create_orders_v3.py     # 발주 변환 (최종)
│   ├── fix_packing_v2.py       # 패킹리스트 ID 정리
│   ├── create_lot_csv.py       # LOT 데이터 변환
│   └── _archive/               # 과거 버전
└── [원본 CSV 파일들]
    ├── product_info.csv
    ├── merged_order_history.csv
    ├── ru_packing_lists.csv
    ├── ru_packing_items_final.csv
    ├── PRODUCTION2.csv
    └── LOTHX.csv
```

## Import 순서

1. `ru_products.csv` → ru_products
2. `ru_prices.csv` → ru_prices
3. `ru_orders.csv` → ru_orders
4. `ru_order_items.csv` → ru_order_items
5. `ru_packing_lists.csv` → ru_packing_lists
6. `ru_packing_items.csv` → ru_packing_items
7. `cm_production_lots.csv` → cm_production_lots

## 완료 상태

- [x] 제품/가격 마이그레이션
- [x] 발주/발주품목 마이그레이션
- [x] 패킹리스트 마이그레이션
- [x] LOT 데이터 마이그레이션
- [x] View 테스트 완료

---

**마지막 업데이트**: 2025-12-23
