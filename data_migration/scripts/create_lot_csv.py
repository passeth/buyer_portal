"""
PRODUCTION2.csv → cm_production_lots.csv 변환
(합산 없이 모든 행 개별 유지)
"""
import csv
from datetime import datetime
from pathlib import Path

BASE_DIR = Path(__file__).parent.parent
OUTPUT_DIR = BASE_DIR / "supabase_ready"
OUTPUT_DIR.mkdir(exist_ok=True)


def parse_date(date_str: str) -> str:
    """'Mar 26, 2025 12:00 AM' → '2025-03-26'"""
    if not date_str:
        return ""
    try:
        dt = datetime.strptime(date_str.strip(), "%b %d, %Y %I:%M %p")
        return dt.strftime("%Y-%m-%d")
    except:
        return date_str.split()[0] if date_str else ""


def calculate_expiry(prod_date: str, years: int = 3) -> str:
    """생산일 + 3년 = 유통기한"""
    if not prod_date:
        return ""
    try:
        dt = datetime.strptime(prod_date, "%Y-%m-%d")
        expiry = dt.replace(year=dt.year + years)
        return expiry.strftime("%Y-%m-%d")
    except:
        return ""


def main():
    print("=== Creating cm_production_lots.csv ===\n")

    input_file = BASE_DIR / "PRODUCTION2.csv"
    output_file = OUTPUT_DIR / "cm_production_lots.csv"

    lots = []

    with open(input_file, "r", encoding="utf-8-sig") as f:
        reader = csv.reader(f)
        header = next(reader)  # Skip header

        for row in reader:
            if len(row) < 4:
                continue

            lot_number = row[0].strip()
            product_id = row[1].strip()
            qty = row[2].strip()
            date_str = row[3]

            if not lot_number or not product_id:
                continue

            production_date = parse_date(date_str)

            # 날짜가 없으면 건너뛰기
            if not production_date:
                continue

            try:
                produced_qty = int(float(qty))
            except:
                produced_qty = 0

            expiry_date = calculate_expiry(production_date)

            lots.append({
                'lot_number': lot_number,
                'product_id': product_id,
                'produced_qty': produced_qty,
                'production_date': production_date,
                'expiry_date': expiry_date,
            })

    # CSV 저장
    with open(output_file, "w", encoding="utf-8", newline="") as f:
        fieldnames = ['lot_number', 'product_id', 'produced_qty',
                     'production_date', 'expiry_date']
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(lots)

    print(f"Created: {output_file.name} ({len(lots)} rows)")

    # 통계
    products = set(l['product_id'] for l in lots)
    lot_numbers = set(l['lot_number'] for l in lots)
    print(f"Unique products: {len(products)}")
    print(f"Unique lot numbers: {len(lot_numbers)}")


if __name__ == "__main__":
    main()
    print("\n=== Done! ===")
