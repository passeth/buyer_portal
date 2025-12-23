"""
패킹리스트의 order_id를 기반으로 ru_orders 생성
+ merged_order_history에서 ru_order_items 생성
"""
import csv
import uuid
import re
from pathlib import Path
from collections import defaultdict

BASE_DIR = Path(__file__).parent.parent
OUTPUT_DIR = BASE_DIR / "supabase_ready"
OUTPUT_DIR.mkdir(exist_ok=True)


def extract_date_from_pl(pl_number: str) -> str:
    """PL-20250127-OV5파렛트 → 2025-01-27"""
    match = re.search(r'(\d{8})', pl_number)
    if match:
        d = match.group(1)
        return f"{d[:4]}-{d[4:6]}-{d[6:8]}"
    return ""


def get_region_code(destination: str) -> str:
    """목적지에서 지역 코드 추출"""
    dest_lower = destination.lower()
    if 'minsk' in dest_lower or '민스크' in destination:
        return 'BY'
    elif 'kz' in dest_lower or 'kazakh' in dest_lower:
        return 'KZ'
    else:
        return 'RU'


def create_orders_from_packing_lists():
    """패킹리스트의 order_id로 ru_orders 생성"""
    input_file = BASE_DIR / "ru_packing_lists.csv"
    output_file = OUTPUT_DIR / "ru_orders.csv"

    # order_id별로 패킹리스트 그룹화
    order_data = {}

    with open(input_file, "r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for row in reader:
            order_id = row['order_id']
            if order_id not in order_data:
                order_data[order_id] = {
                    'id': order_id,
                    'pl_number': row['pl_number'],
                    'invoice_date': row['invoice_date'],
                    'consignee_name': row['consignee_name'],
                    'total_nw_kg': float(row.get('total_nw_kg', 0) or 0),
                    'total_pallets': int(row.get('total_pallets', 0) or 0),
                }
            else:
                # 여러 패킹리스트가 같은 order_id를 참조하면 합산
                order_data[order_id]['total_nw_kg'] += float(row.get('total_nw_kg', 0) or 0)
                order_data[order_id]['total_pallets'] += int(row.get('total_pallets', 0) or 0)

    # ru_orders 생성
    orders = []
    seq_counter = defaultdict(int)

    for order_id, data in order_data.items():
        order_date = extract_date_from_pl(data['pl_number'])
        if not order_date:
            order_date = data['invoice_date'].split()[0] if data['invoice_date'] else '2025-01-01'

        # destination 추출 (pl_number에서)
        pl = data['pl_number']
        if 'OV' in pl or '블라' in pl:
            destination = '블라디보스톡'
            region = 'RU'
        elif 'FO' in pl:
            destination = '포항 (FO)'
            region = 'RU'
        elif '스크' in pl or '스톡' in pl:
            destination = '스톡'
            region = 'RU'
        elif '다르' in pl:
            destination = '크라스노다르'
            region = 'RU'
        elif '체' in pl:
            destination = '체렙'
            region = 'RU'
        else:
            destination = data['consignee_name'] or ''
            region = 'RU'

        # order_number 생성
        year = order_date[:4] if order_date else '2025'
        seq_key = f"{region}-{year}"
        seq_counter[seq_key] += 1
        order_number = f"{seq_key}-{seq_counter[seq_key]:04d}"

        orders.append({
            'id': order_id,
            'order_number': order_number,
            'order_date': order_date,
            'destination': destination,
            'status': 'COMPLETED',
            'total_qty': 0,  # 나중에 items에서 계산
            'total_cartons': 0,
            'total_amount': 0,
            'remarks': f'Imported from packing list: {data["pl_number"]}',
        })

    # Write ru_orders.csv
    with open(output_file, "w", encoding="utf-8", newline="") as f:
        fieldnames = ['id', 'order_number', 'order_date', 'destination', 'status',
                     'total_qty', 'total_cartons', 'total_amount', 'remarks']
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(orders)

    print(f"Created: {output_file.name} ({len(orders)} rows)")
    return {o['id']: o for o in orders}


def create_order_items_from_history():
    """merged_order_history에서 ru_order_items 생성 (새 order_id 사용)"""
    input_file = BASE_DIR / "merged_order_history.csv"
    output_file = OUTPUT_DIR / "ru_order_items.csv"
    orders_file = OUTPUT_DIR / "ru_orders_from_history.csv"

    # OrderDate + Destination으로 그룹화
    order_groups = defaultdict(list)

    with open(input_file, "r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for row in reader:
            key = (row['OrderDate'], row['Destination'])
            order_groups[key].append(row)

    # orders와 items 생성
    orders = []
    items = []
    seq_counter = defaultdict(int)

    for (order_date, destination), rows in sorted(order_groups.items()):
        # order_id 생성
        order_id = str(uuid.uuid4())

        # region 추출
        region = get_region_code(destination)
        year = order_date[:4] if order_date else '2025'
        seq_key = f"{region}-{year}"
        seq_counter[seq_key] += 1
        order_number = f"{seq_key}-{seq_counter[seq_key]:04d}"

        # totals 계산
        total_qty = sum(int(float(r.get('Quantity', 0) or 0)) for r in rows)
        total_amount = sum(int(float(r.get('PaymentAmountTotal', 0) or 0)) for r in rows)

        orders.append({
            'id': order_id,
            'order_number': order_number,
            'order_date': order_date,
            'destination': destination,
            'status': 'COMPLETED',
            'total_qty': total_qty,
            'total_cartons': 0,
            'total_amount': total_amount,
            'remarks': '',
        })

        # items
        for row in rows:
            product_name = row.get('EnglishName', '').replace('\n', ' ').strip()
            qty = int(float(row.get('Quantity', 0) or 0))
            supply_price = int(float(row.get('SupplyPriceUnit', 0) or 0))
            commission = int(float(row.get('CommissionUnit', 0) or 0))
            unit_price = int(float(row.get('PaymentAmountUnit', 0) or 0))
            subtotal = int(float(row.get('PaymentAmountTotal', 0) or 0))

            items.append({
                'id': str(uuid.uuid4()),
                'order_id': order_id,
                'product_code': row.get('ProductCode', ''),
                'product_name': product_name,
                'qty': qty,
                'supply_price': supply_price,
                'commission': commission,
                'unit_price': unit_price,
                'subtotal': subtotal,
            })

    # Write files
    with open(orders_file, "w", encoding="utf-8", newline="") as f:
        fieldnames = ['id', 'order_number', 'order_date', 'destination', 'status',
                     'total_qty', 'total_cartons', 'total_amount', 'remarks']
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(orders)

    with open(output_file, "w", encoding="utf-8", newline="") as f:
        fieldnames = ['id', 'order_id', 'product_code', 'product_name', 'qty',
                     'supply_price', 'commission', 'unit_price', 'subtotal']
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(items)

    print(f"Created: {orders_file.name} ({len(orders)} orders)")
    print(f"Created: {output_file.name} ({len(items)} items)")


if __name__ == "__main__":
    print("=== Creating Orders Data ===\n")

    print("[1] From packing_lists (keeps existing order_id references):")
    create_orders_from_packing_lists()

    print()
    print("[2] From merged_order_history (new order_ids):")
    create_order_items_from_history()

    print()
    print("=== Done! ===")
    print()
    print("Import options:")
    print("  A) Use ru_orders.csv (패킹리스트 연결 유지)")
    print("  B) Use ru_orders_from_history.csv + ru_order_items.csv (상세 이력)")
