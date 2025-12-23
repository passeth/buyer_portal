"""
패킹리스트 ID 정리 v2:
- 원본에서 UUID → 새 pl_number 매핑 생성
- 중복 pl_number에 -A, -B 접미사 추가
"""
import csv
import re
from pathlib import Path
from collections import defaultdict

BASE_DIR = Path(__file__).parent.parent
OUTPUT_DIR = BASE_DIR / "supabase_ready"


def clean_pl_number(pl: str) -> str:
    """PL-20250127-OV5파렛트 → PL-20250127-OV5"""
    pl = re.sub(r'\s+\d{2}:\d{2}:\d{2}', '', pl)  # 타임스탬프 제거
    pl = re.sub(r'파렛트|파레트', '', pl)  # 파렛트 제거
    return pl.strip()


def process():
    # 원본 파일들
    orig_lists = BASE_DIR / "ru_packing_lists.csv"
    orig_items = BASE_DIR / "ru_packing_items_final.csv"

    # 1. 원본 packing_lists 읽기 - UUID와 pl_number 매핑
    uuid_to_new_pl = {}
    pl_counter = defaultdict(int)
    packing_lists = []

    with open(orig_lists, "r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        orig_fields = reader.fieldnames

        for row in reader:
            uuid = row['id']
            old_pl = row['pl_number']
            base_pl = clean_pl_number(old_pl)

            # 중복 체크
            pl_counter[base_pl] += 1
            if pl_counter[base_pl] > 1:
                new_pl = f"{base_pl}-{chr(ord('A') + pl_counter[base_pl] - 1)}"
            else:
                new_pl = base_pl

            uuid_to_new_pl[uuid] = new_pl

            # 새 행 생성
            new_row = dict(row)
            new_row['pl_number'] = new_pl

            # order_id 업데이트 (월 기준)
            invoice_date = row.get('invoice_date', '')
            if invoice_date:
                match = re.match(r'(\d{4})-(\d{2})', invoice_date)
                if match:
                    new_row['order_id'] = f"RU-{match.group(1)}-{match.group(2)}"

            # 날짜 정리
            new_row['invoice_date'] = invoice_date.split()[0] if ' ' in invoice_date else invoice_date

            packing_lists.append(new_row)

    print(f"Loaded {len(packing_lists)} packing lists")
    print(f"UUID mappings: {len(uuid_to_new_pl)}")

    # 중복 확인
    duplicates = {k: v for k, v in pl_counter.items() if v > 1}
    if duplicates:
        print(f"Duplicates (fixed with suffix): {duplicates}")

    # 2. packing_lists 저장 (id 필드 제거)
    new_fields = [f for f in orig_fields if f != 'id']

    with open(OUTPUT_DIR / "ru_packing_lists.csv", "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=new_fields)
        writer.writeheader()
        for row in packing_lists:
            row_clean = {k: v for k, v in row.items() if k != 'id'}
            writer.writerow(row_clean)

    print(f"Saved: ru_packing_lists.csv")

    # 3. packing_items 업데이트
    items = []
    with open(orig_items, "r", encoding="utf-8-sig") as f:
        reader = csv.DictReader(f)
        items_fields = reader.fieldnames

        for row in reader:
            old_pl_id = row['packing_list_id']
            if old_pl_id in uuid_to_new_pl:
                row['packing_list_id'] = uuid_to_new_pl[old_pl_id]

            # product_name 정리
            if 'product_name' in row:
                row['product_name'] = row['product_name'].replace('\n', ' ').strip()

            # pallet_number 정리
            if 'pallet_number' in row and row['pallet_number']:
                try:
                    row['pallet_number'] = str(int(float(row['pallet_number'])))
                except:
                    pass

            items.append(row)

    with open(OUTPUT_DIR / "ru_packing_items.csv", "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=items_fields)
        writer.writeheader()
        writer.writerows(items)

    print(f"Saved: ru_packing_items.csv ({len(items)} items)")

    # 4. 검증
    print("\n=== Verification ===")
    pl_set = set(row['pl_number'] for row in packing_lists)
    items_pl_set = set(row['packing_list_id'] for row in items)

    print(f"Unique pl_numbers: {len(pl_set)}")
    print(f"Unique packing_list_ids in items: {len(items_pl_set)}")
    print(f"All items reference valid lists: {items_pl_set <= pl_set}")

    missing = items_pl_set - pl_set
    if missing:
        print(f"Missing references: {missing}")


if __name__ == "__main__":
    print("=== Fixing Packing IDs v2 ===\n")
    process()
    print("\n=== Done! ===")
