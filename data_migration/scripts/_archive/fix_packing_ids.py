"""
패킹리스트 ID 정리:
1. pl_number에서 '파렛트'/'파레트' 제거
2. ru_packing_items.packing_list_id를 UUID → pl_number로 변경
3. ru_packing_lists에서 id 필드 제거
"""
import csv
import re
from pathlib import Path

BASE_DIR = Path(__file__).parent.parent
OUTPUT_DIR = BASE_DIR / "supabase_ready"


def clean_pl_number(pl: str) -> str:
    """PL-20250127-OV5파렛트 → PL-20250127-OV5"""
    # 파렛트, 파레트 제거
    pl = re.sub(r'파렛트|파레트', '', pl)
    return pl.strip()


def process():
    packing_lists_file = OUTPUT_DIR / "ru_packing_lists.csv"
    packing_items_file = OUTPUT_DIR / "ru_packing_items.csv"

    # 1. ru_packing_lists 읽고 UUID → pl_number 매핑 생성
    id_to_pl = {}
    packing_lists = []

    with open(packing_lists_file, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        original_fields = reader.fieldnames

        for row in reader:
            old_id = row['id']
            old_pl = row['pl_number']
            new_pl = clean_pl_number(old_pl)

            id_to_pl[old_id] = new_pl
            row['pl_number'] = new_pl
            packing_lists.append(row)

    print(f"Loaded {len(packing_lists)} packing lists")
    print(f"ID mapping created: {len(id_to_pl)} entries")
    print()
    print("Sample mappings:")
    for i, (old_id, new_pl) in enumerate(list(id_to_pl.items())[:5]):
        print(f"  {old_id[:20]}... → {new_pl}")

    # 2. ru_packing_lists 저장 (id 필드 제거)
    new_fields = [f for f in original_fields if f != 'id']

    with open(packing_lists_file, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=new_fields)
        writer.writeheader()
        for row in packing_lists:
            # id 필드 제거
            row_without_id = {k: v for k, v in row.items() if k != 'id'}
            writer.writerow(row_without_id)

    print(f"\nUpdated: ru_packing_lists.csv (id 필드 제거됨)")

    # 3. ru_packing_items의 packing_list_id를 UUID → pl_number로 변경
    packing_items = []
    not_found = set()

    with open(packing_items_file, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        items_fields = reader.fieldnames

        for row in reader:
            old_pl_id = row['packing_list_id']
            if old_pl_id in id_to_pl:
                row['packing_list_id'] = id_to_pl[old_pl_id]
            else:
                not_found.add(old_pl_id)
            packing_items.append(row)

    with open(packing_items_file, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=items_fields)
        writer.writeheader()
        writer.writerows(packing_items)

    print(f"Updated: ru_packing_items.csv ({len(packing_items)} items)")

    if not_found:
        print(f"WARNING: {len(not_found)} packing_list_ids not found in mapping")

    # 4. 검증
    print("\n=== Verification ===")
    pl_numbers = set(row['pl_number'] for row in packing_lists)
    item_pl_ids = set(row['packing_list_id'] for row in packing_items)

    print(f"Unique pl_numbers in lists: {len(pl_numbers)}")
    print(f"Unique packing_list_ids in items: {len(item_pl_ids)}")
    print(f"Match: {pl_numbers == item_pl_ids}")

    print("\nSample pl_numbers:")
    for pl in sorted(pl_numbers)[:5]:
        print(f"  {pl}")


if __name__ == "__main__":
    print("=== Fixing Packing List IDs ===\n")
    process()
    print("\n=== Done! ===")
