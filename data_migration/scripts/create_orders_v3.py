"""
merged_order_history.csv에서 모든 행 유지하여 orders/order_items 생성
- order_id: RU-2025-01 형식 (월별)
- destination: 각 행에 유지
- SourceFile 컬럼만 제외
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
    date_str = date_str.strip()
    match = re.match(r'(\d{4})-(\d{2})', date_str)
    if match:
        return f"{match.group(1)}-{match.group(2)}"
    return ""


def generate_order_id(year_month: str) -> str:
    """RU-2025-01 형식의 order_id 생성"""
    if not year_month:
        return "RU-2025-01"
    return f"RU-{year_month}"


def process_order_history():
    """merged_order_history.csv → ru_orders.csv + ru_order_items.csv"""
    input_file = BASE_DIR / "merged_order_history.csv"
    orders_file = OUTPUT_DIR / "ru_orders.csv"
    items_file = OUTPUT_DIR / "ru_order_items.csv"

    # 월별 데이터 수집
    month_data = defaultdict(lambda: {
        'items': [],
        'destinations': set(),
        'total_qty': 0,
        'total_amount': 0,
        'order_date': ''
    })

    all_items = []
    item_count = 0

    with open(input_file, "r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for row in reader:
            order_date = row.get('OrderDate', '')
            year_month = extract_year_month(order_date)
            order_id = generate_order_id(year_month)

            # 데이터 추출
            product_code = row.get('ProductCode', '').strip()
            if not product_code:
                continue

            product_name = row.get('EnglishName', '').replace('\n', ' ').strip()
            destination = row.get('Destination', '').strip()

            # 숫자 필드 안전하게 변환
            def safe_int(val):
                try:
                    return int(float(val)) if val else 0
                except (ValueError, TypeError):
                    return 0

            pcs_per_ctn = safe_int(row.get('PcsPerCtn', 0))
            qty = safe_int(row.get('Quantity', 0))
            supply_price = safe_int(row.get('SupplyPriceUnit', 0))
            commission = safe_int(row.get('CommissionUnit', 0))
            unit_price = safe_int(row.get('PaymentAmountUnit', 0))
            supply_total = safe_int(row.get('SupplyPriceTotal', 0))
            commission_total = safe_int(row.get('CommissionTotal', 0))
            subtotal = safe_int(row.get('PaymentAmountTotal', 0))

            # 월별 집계
            month_data[order_id]['destinations'].add(destination)
            month_data[order_id]['total_qty'] += qty
            month_data[order_id]['total_amount'] += subtotal
            if not month_data[order_id]['order_date']:
                month_data[order_id]['order_date'] = order_date

            # 개별 아이템 (모든 행 유지)
            item_count += 1
            all_items.append({
                'order_id': order_id,
                'product_code': product_code,
                'product_name': product_name,
                'destination': destination,
                'pcs_per_ctn': pcs_per_ctn,
                'requested_qty': qty,
                'supply_price': supply_price,
                'commission': commission,
                'unit_price': unit_price,
                'supply_total': supply_total,
                'commission_total': commission_total,
                'subtotal': subtotal,
            })

    # ru_orders 생성
    orders = []
    for order_id in sorted(month_data.keys()):
        data = month_data[order_id]
        destinations = ', '.join(sorted(d for d in data['destinations'] if d))

        orders.append({
            'id': order_id,
            'order_number': order_id,
            'order_date': data['order_date'],
            'destination': destinations[:200] if len(destinations) > 200 else destinations,
            'status': 'COMPLETED',
            'total_qty': data['total_qty'],
            'total_cartons': 0,
            'total_amount': data['total_amount'],
            'remarks': f"{len(data['destinations'])} destinations",
        })

    # Write ru_orders.csv
    with open(orders_file, "w", encoding="utf-8", newline="") as f:
        fieldnames = ['id', 'order_number', 'order_date', 'destination', 'status',
                     'total_qty', 'total_cartons', 'total_amount', 'remarks']
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(orders)

    # Write ru_order_items.csv (모든 필드 유지)
    with open(items_file, "w", encoding="utf-8", newline="") as f:
        fieldnames = ['order_id', 'product_code', 'product_name', 'destination',
                     'pcs_per_ctn', 'requested_qty', 'supply_price', 'commission',
                     'unit_price', 'supply_total', 'commission_total', 'subtotal']
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(all_items)

    print(f"Created: {orders_file.name} ({len(orders)} orders)")
    print(f"Created: {items_file.name} ({len(all_items)} items)")

    # 월별 통계
    print("\nMonthly breakdown:")
    for order_id in sorted(month_data.keys()):
        data = month_data[order_id]
        items_count = sum(1 for i in all_items if i['order_id'] == order_id)
        print(f"  {order_id}: {items_count} items, {len(data['destinations'])} destinations")


def process_packing_lists():
    """패킹리스트 order_id를 월 기준으로 변경"""
    input_file = BASE_DIR / "ru_packing_lists.csv"
    output_file = OUTPUT_DIR / "ru_packing_lists.csv"

    rows = []
    with open(input_file, "r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames

        for row in reader:
            invoice_date = row.get('invoice_date', '')
            year_month = extract_year_month(invoice_date)
            row['order_id'] = generate_order_id(year_month)

            # pl_number 정리
            pl = row.get('pl_number', '')
            row['pl_number'] = re.sub(r'\s+\d{2}:\d{2}:\d{2}', '', pl)
            row['invoice_date'] = invoice_date.split()[0] if ' ' in invoice_date else invoice_date

            rows.append(row)

    with open(output_file, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    print(f"\nCreated: {output_file.name} ({len(rows)} rows)")


if __name__ == "__main__":
    print("=== Creating Orders (All Rows Preserved) ===\n")

    process_order_history()
    process_packing_lists()

    print("\n=== Done! ===")
