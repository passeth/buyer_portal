"""
CSV 파일을 Supabase 임포트용으로 변환하는 스크립트
"""
import csv
import re
from pathlib import Path
from datetime import datetime

BASE_DIR = Path(__file__).parent.parent
OUTPUT_DIR = BASE_DIR / "supabase_ready"
OUTPUT_DIR.mkdir(exist_ok=True)


def clean_price(value: str) -> int:
    """콤마 제거하고 정수로 변환 (소수점은 반올림)"""
    if not value:
        return 0
    cleaned = value.replace(",", "")
    return int(round(float(cleaned)))


def clean_date(value: str) -> str:
    """날짜 형식 정리 (YYYY-MM-DD)"""
    if not value:
        return ""
    # "2025-01-27 00:00:00" -> "2025-01-27"
    return value.split()[0] if " " in value else value


def clean_pl_number(value: str) -> str:
    """패킹리스트 번호에서 타임스탬프 제거"""
    # "PL-20250127 00:00:00-OV5파렛트" -> "PL-20250127-OV5파렛트"
    return re.sub(r"\s+\d{2}:\d{2}:\d{2}", "", value)


def clean_product_name(value: str) -> str:
    """제품명에서 줄바꿈 제거"""
    return value.replace("\n", " ").strip()


def process_product_info():
    """product_info.csv -> ru_products.csv + ru_prices.csv"""
    input_file = BASE_DIR / "product_info.csv"
    products_file = OUTPUT_DIR / "ru_products.csv"
    prices_file = OUTPUT_DIR / "ru_prices.csv"

    products = []
    prices = []

    with open(input_file, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            # Skip rows with empty product_code
            if not row.get("product_code", "").strip():
                continue

            # ru_products
            product = {
                "product_code": row["product_code"],
                "brand": row["brand"],
                "name_ko": row["name_ko"],
                "name_en": row.get("name_en", ""),
                "name_ru": row.get("name_ru", ""),
                "barcode": row.get("barcode", ""),
                "pcs_per_carton": row.get("pcs_per_carton", "1"),
                "width_cm": row.get("W", ""),
                "height_cm": row.get("H", ""),
                "depth_cm": row.get("L", ""),
                "cbm": row.get("CBM", ""),
                "hscode": row.get("hscode", ""),
                "status": "active"
            }
            products.append(product)

            # ru_prices
            price = {
                "product_code": row["product_code"],
                "supply_price": clean_price(row.get("price_supply", "0")),
                "commission": clean_price(row.get("commission", "0")),
                "final_price": clean_price(row.get("price_unit", "0")),
                "effective_date": "2025-01-01"
            }
            prices.append(price)

    # Write ru_products.csv
    with open(products_file, "w", encoding="utf-8", newline="") as f:
        fieldnames = ["product_code", "brand", "name_ko", "name_en", "name_ru",
                     "barcode", "pcs_per_carton", "width_cm", "height_cm",
                     "depth_cm", "cbm", "hscode", "status"]
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(products)

    # Write ru_prices.csv
    with open(prices_file, "w", encoding="utf-8", newline="") as f:
        fieldnames = ["product_code", "supply_price", "commission", "final_price", "effective_date"]
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(prices)

    print(f"Created: {products_file.name} ({len(products)} rows)")
    print(f"Created: {prices_file.name} ({len(prices)} rows)")


def process_packing_lists():
    """ru_packing_lists.csv 정리"""
    input_file = BASE_DIR / "ru_packing_lists.csv"
    output_file = OUTPUT_DIR / "ru_packing_lists.csv"

    rows = []
    with open(input_file, "r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for row in reader:
            cleaned = {
                "id": row["id"],
                "order_id": row["order_id"],
                "pl_number": clean_pl_number(row["pl_number"]),
                "invoice_number": clean_date(row.get("invoice_number", "")),
                "invoice_date": clean_date(row.get("invoice_date", "")),
                "consignee_name": row.get("consignee_name", ""),
                "consignee_address": row.get("consignee_address", ""),
                "consignee_tel": row.get("consignee_tel", ""),
                "consignee_email": row.get("consignee_email", ""),
                "exporter_name": row.get("exporter_name", ""),
                "manufacturer": row.get("manufacturer", ""),
                "shipping_port": row.get("shipping_port", ""),
                "departure_date": clean_date(row.get("departure_date", "")),
                "destination": row.get("destination", ""),
                "vessel_flight": row.get("vessel_flight", ""),
                "payment_term": row.get("payment_term", ""),
                "total_cartons": row.get("total_cartons", "0"),
                "total_nw_kg": row.get("total_nw_kg", "0"),
                "total_gw_kg": row.get("total_gw_kg", "0"),
                "total_cbm": row.get("total_cbm", "0"),
                "total_pallets": row.get("total_pallets", "0"),
            }
            rows.append(cleaned)

    with open(output_file, "w", encoding="utf-8", newline="") as f:
        fieldnames = list(rows[0].keys())
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    print(f"Created: {output_file.name} ({len(rows)} rows)")


def process_packing_items():
    """ru_packing_items_final.csv 정리"""
    input_file = BASE_DIR / "ru_packing_items_final.csv"
    output_file = OUTPUT_DIR / "ru_packing_items.csv"

    rows = []
    with open(input_file, "r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        for row in reader:
            # pallet_number: 1.0 -> 1
            pallet_num = row.get("pallet_number", "")
            if pallet_num:
                pallet_num = str(int(float(pallet_num)))

            cleaned = {
                "id": row["id"],
                "packing_list_id": row["packing_list_id"],
                "product_code": row["product_code"],
                "product_name": clean_product_name(row.get("product_name", "")),
                "qty": row.get("qty", "0"),
                "cartons": row.get("cartons", "0"),
                "nw_kg": row.get("nw_kg", "0"),
                "gw_kg": row.get("gw_kg", "0"),
                "cbm": row.get("cbm", "0"),
                "pallet_number": pallet_num,
            }
            rows.append(cleaned)

    with open(output_file, "w", encoding="utf-8", newline="") as f:
        fieldnames = list(rows[0].keys())
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    print(f"Created: {output_file.name} ({len(rows)} rows)")


if __name__ == "__main__":
    print("=== CSV Cleaning for Supabase Import ===\n")

    process_product_info()
    print()

    process_packing_lists()
    print()

    process_packing_items()

    print(f"\n=== Done! Output files in: {OUTPUT_DIR} ===")
