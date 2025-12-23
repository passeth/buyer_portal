"""
LOT 재고 추적 CSV 생성
- PRODUCTION.csv (생산 내역) + cm_erp_products (현재고) → cm_production_lots.csv

FIFO 로직:
- 현재고를 최신 LOT부터 역순으로 배분
- 예: 현재고 1000개, LOT1(12/2, 800개), LOT2(11/30, 800개)
  → LOT1에 800개, LOT2에 200개 배분
"""
import csv
from datetime import datetime
from pathlib import Path
from collections import defaultdict

BASE_DIR = Path(__file__).parent.parent
OUTPUT_DIR = BASE_DIR / "supabase_ready"
OUTPUT_DIR.mkdir(exist_ok=True)


def parse_date(date_str: str) -> datetime:
    """'Mar 26, 2025 12:00 AM' → datetime"""
    if not date_str:
        return None
    try:
        # "Mar 26, 2025 12:00 AM"
        return datetime.strptime(date_str.strip(), "%b %d, %Y %I:%M %p")
    except:
        try:
            # "2025-03-26"
            return datetime.strptime(date_str.strip(), "%Y-%m-%d")
        except:
            return None


def format_date(dt: datetime) -> str:
    """datetime → 'YYYY-MM-DD'"""
    return dt.strftime("%Y-%m-%d") if dt else ""


def load_production():
    """PRODUCTION.csv 로드"""
    production_file = BASE_DIR / "PRODUCTION.csv"
    lots = []

    with open(production_file, "r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for row in reader:
            lot_no = row.get('Lot No', '').strip()
            product_id = row.get('prdcode', '').strip()
            qty = int(row.get('QTY', 0) or 0)
            date_str = row.get('DATE', '')
            prod_date = parse_date(date_str)

            if lot_no and product_id and qty > 0:
                lots.append({
                    'lot_number': lot_no,
                    'product_id': product_id,
                    'produced_qty': qty,
                    'production_date': prod_date,
                })

    print(f"Loaded {len(lots)} production lots")
    return lots


def load_inventory():
    """cm_erp_products 재고 로드 (Supabase에서 export 필요)"""
    inventory_file = BASE_DIR / "cm_erp_products.csv"

    if not inventory_file.exists():
        print(f"WARNING: {inventory_file} not found!")
        print("Please export cm_erp_products from Supabase:")
        print("  SELECT product_id, name, bal_qty FROM cm_erp_products")
        return {}

    inventory = {}
    with open(inventory_file, "r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for row in reader:
            product_id = row.get('product_id', '').strip()
            bal_qty = int(row.get('bal_qty', 0) or 0)
            if product_id:
                inventory[product_id] = bal_qty

    print(f"Loaded {len(inventory)} products with inventory")
    return inventory


def calculate_fifo(lots: list, inventory: dict) -> list:
    """
    FIFO 기준으로 현재고를 LOT에 배분

    로직:
    - 각 품목별로 LOT을 날짜 내림차순 정렬 (최신 먼저)
    - 현재고를 최신 LOT부터 배분
    - 오래된 LOT은 이미 소진된 것으로 간주
    """
    # 품목별로 LOT 그룹화
    lots_by_product = defaultdict(list)
    for lot in lots:
        lots_by_product[lot['product_id']].append(lot)

    result = []

    for product_id, product_lots in lots_by_product.items():
        current_stock = inventory.get(product_id, 0)

        # 날짜 내림차순 정렬 (최신 먼저)
        sorted_lots = sorted(
            product_lots,
            key=lambda x: x['production_date'] or datetime.min,
            reverse=True
        )

        remaining_to_allocate = current_stock

        for lot in sorted_lots:
            if remaining_to_allocate <= 0:
                # 더 이상 배분할 재고 없음 → 이 LOT은 소진됨
                remaining_qty = 0
                status = 'depleted'
            elif remaining_to_allocate >= lot['produced_qty']:
                # 이 LOT 전량이 재고에 포함
                remaining_qty = lot['produced_qty']
                remaining_to_allocate -= lot['produced_qty']
                status = 'active'
            else:
                # 이 LOT 일부만 재고에 포함
                remaining_qty = remaining_to_allocate
                remaining_to_allocate = 0
                status = 'active'

            # 유통기한: 생산일 + 3년 (기본값)
            expiry_date = None
            if lot['production_date']:
                try:
                    expiry_date = lot['production_date'].replace(
                        year=lot['production_date'].year + 3
                    )
                except:
                    pass

            result.append({
                'lot_number': lot['lot_number'],
                'product_id': product_id,
                'produced_qty': lot['produced_qty'],
                'production_date': format_date(lot['production_date']),
                'remaining_qty': remaining_qty,
                'expiry_date': format_date(expiry_date),
                'status': status,
            })

    return result


def main():
    print("=== Creating LOT Inventory ===\n")

    # 1. 데이터 로드
    lots = load_production()
    inventory = load_inventory()

    if not inventory:
        print("\nCreating production lots without FIFO calculation...")
        # 재고 데이터 없으면 produced_qty = remaining_qty로 설정
        result = []
        for lot in lots:
            expiry_date = None
            if lot['production_date']:
                try:
                    expiry_date = lot['production_date'].replace(
                        year=lot['production_date'].year + 3
                    )
                except:
                    pass

            result.append({
                'lot_number': lot['lot_number'],
                'product_id': lot['product_id'],
                'produced_qty': lot['produced_qty'],
                'production_date': format_date(lot['production_date']),
                'remaining_qty': lot['produced_qty'],  # 전량 잔여
                'expiry_date': format_date(expiry_date),
                'status': 'active',
            })
    else:
        # 2. FIFO 계산
        print("\nCalculating FIFO allocation...")
        result = calculate_fifo(lots, inventory)

    # 3. CSV 저장
    output_file = OUTPUT_DIR / "cm_production_lots.csv"
    with open(output_file, "w", encoding="utf-8", newline="") as f:
        fieldnames = ['lot_number', 'product_id', 'produced_qty', 'production_date',
                     'remaining_qty', 'expiry_date', 'status']
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(result)

    print(f"\nSaved: {output_file.name} ({len(result)} rows)")

    # 4. 통계
    active = sum(1 for r in result if r['status'] == 'active')
    depleted = sum(1 for r in result if r['status'] == 'depleted')
    print(f"Active LOTs: {active}")
    print(f"Depleted LOTs: {depleted}")


if __name__ == "__main__":
    main()
    print("\n=== Done! ===")
