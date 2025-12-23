"""
월 기준 order_id로 패킹리스트와 주문이력 연결
order_id 형식: RU-2025-01, RU-2025-02 등
"""
import csv
import re
from pathlib import Path
from collections import defaultdict

BASE_DIR = Path(__file__).parent.parent
OUTPUT_DIR = BASE_DIR / "supabase_ready"
OUTPUT_DIR.mkdir(exist_ok=True)


def extract_year_month(date_str: str) -> str:
    """날짜에서 YYYY-MM 추출"""
    if not date_str:
        return ""
    # "2025-01-27" or "20250127" or "2025-01-27 00:00:00"
    date_str = date_str.strip()

    # Try YYYY-MM-DD format
    match = re.match(r'(\d{4})-(\d{2})', date_str)
    if match:
        return f"{match.group(1)}-{match.group(2)}"

    # Try YYYYMMDD format
    match = re.match(r'(\d{4})(\d{2})', date_str)
    if match:
        return f"{match.group(1)}-{match.group(2)}"

    return ""


def generate_order_id(year_month: str) -> str:
    """RU-2025-01 형식의 order_id 생성"""
    if not year_month:
        return "RU-2025-01"
    return f"RU-{year_month}"


def process_packing_lists():
    """패킹리스트 order_id를 월 기준으로 변경"""
    input_file = BASE_DIR / "ru_packing_lists.csv"
    output_file = OUTPUT_DIR / "ru_packing_lists.csv"

    rows = []
    with open(input_file, "r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames

        for row in reader:
            # invoice_date에서 월 추출
            invoice_date = row.get('invoice_date', '')
            year_month = extract_year_month(invoice_date)

            # order_id를 월 기준으로 변경
            row['order_id'] = generate_order_id(year_month)

            # pl_number 정리 (타임스탬프 제거)
            pl = row.get('pl_number', '')
            row['pl_number'] = re.sub(r'\s+\d{2}:\d{2}:\d{2}', '', pl)

            # 날짜 정리
            row['invoice_date'] = invoice_date.split()[0] if ' ' in invoice_date else invoice_date

            rows.append(row)

    with open(output_file, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    print(f"Created: {output_file.name} ({len(rows)} rows)")

    # order_id 분포 출력
    order_counts = defaultdict(int)
    for row in rows:
        order_counts[row['order_id']] += 1
    print(f"  Order IDs: {dict(sorted(order_counts.items()))}")


def process_orders_and_items():
    """주문이력에서 orders와 items 생성 (월 기준 order_id)"""
    input_file = BASE_DIR / "merged_order_history.csv"
    orders_file = OUTPUT_DIR / "ru_orders.csv"
    items_file = OUTPUT_DIR / "ru_order_items.csv"

    # OrderDate에서 월별로 그룹화
    month_data = defaultdict(lambda: {'items': [], 'destinations': set()})

    with open(input_file, "r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for row in reader:
            order_date = row.get('OrderDate', '')
            year_month = extract_year_month(order_date)
            order_id = generate_order_id(year_month)

            month_data[order_id]['items'].append(row)
            month_data[order_id]['destinations'].add(row.get('Destination', ''))
            month_data[order_id]['order_date'] = order_date

    # ru_orders 생성 (월별 1개)
    orders = []
    items = []
    item_id = 1

    for order_id in sorted(month_data.keys()):
        data = month_data[order_id]

        # 합계 계산
        total_qty = sum(int(float(r.get('Quantity', 0) or 0)) for r in data['items'])
        total_amount = sum(int(float(r.get('PaymentAmountTotal', 0) or 0)) for r in data['items'])

        # 목적지 목록
        destinations = ', '.join(sorted(d for d in data['destinations'] if d))

        orders.append({
            'id': order_id,
            'order_number': order_id,
            'order_date': data['order_date'],
            'destination': destinations[:100] if len(destinations) > 100 else destinations,
            'status': 'COMPLETED',
            'total_qty': total_qty,
            'total_cartons': 0,
            'total_amount': total_amount,
            'remarks': f"{len(data['items'])} items, {len(data['destinations'])} destinations",
        })

        # ru_order_items 생성 (같은 order_id + product_code는 합산)
        item_aggregates = {}
        for row in data['items']:
            product_code = row.get('ProductCode', '')
            if not product_code:
                continue

            key = (order_id, product_code)
            qty = int(float(row.get('Quantity', 0) or 0))
            supply_price = int(float(row.get('SupplyPriceUnit', 0) or 0))
            commission = int(float(row.get('CommissionUnit', 0) or 0))
            unit_price = int(float(row.get('PaymentAmountUnit', 0) or 0))
            subtotal = int(float(row.get('PaymentAmountTotal', 0) or 0))
            product_name = row.get('EnglishName', '').replace('\n', ' ').strip()

            if key in item_aggregates:
                # 합산
                item_aggregates[key]['requested_qty'] += qty
                item_aggregates[key]['subtotal'] += subtotal
            else:
                item_aggregates[key] = {
                    'order_id': order_id,
                    'product_code': product_code,
                    'product_name': product_name,
                    'requested_qty': qty,
                    'supply_price': supply_price,
                    'commission': commission,
                    'unit_price': unit_price,
                    'subtotal': subtotal,
                }

        for item_data in item_aggregates.values():
            items.append(item_data)
            item_id += 1

    # Write files
    with open(orders_file, "w", encoding="utf-8", newline="") as f:
        fieldnames = ['id', 'order_number', 'order_date', 'destination', 'status',
                     'total_qty', 'total_cartons', 'total_amount', 'remarks']
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(orders)

    with open(items_file, "w", encoding="utf-8", newline="") as f:
        fieldnames = ['order_id', 'product_code', 'product_name', 'requested_qty',
                     'supply_price', 'commission', 'unit_price', 'subtotal']
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(items)

    print(f"Created: {orders_file.name} ({len(orders)} orders)")
    print(f"Created: {items_file.name} ({len(items)} items)")


if __name__ == "__main__":
    print("=== Creating Orders with Month-based IDs ===\n")

    print("[1] Processing packing_lists:")
    process_packing_lists()

    print()
    print("[2] Processing orders & items:")
    process_orders_and_items()

    print()
    print("=== Done! ===")
    print()
    print("Import order:")
    print("  1. ru_products.csv")
    print("  2. ru_prices.csv")
    print("  3. ru_orders.csv")
    print("  4. ru_order_items.csv")
    print("  5. ru_packing_lists.csv")
    print("  6. ru_packing_items.csv")
