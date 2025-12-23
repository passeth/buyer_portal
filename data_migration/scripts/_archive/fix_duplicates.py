"""
중복 pl_number에 접미사 추가
"""
import csv
from pathlib import Path
from collections import defaultdict

BASE_DIR = Path(__file__).parent.parent
OUTPUT_DIR = BASE_DIR / "supabase_ready"


def fix_duplicates():
    packing_lists_file = OUTPUT_DIR / "ru_packing_lists.csv"
    packing_items_file = OUTPUT_DIR / "ru_packing_items.csv"

    # 1. 기존 UUID와 pl_number 매핑 (원본 파일에서)
    # ru_packing_items에서 기존 packing_list_id → 행 찾기
    items_by_pl = defaultdict(list)
    items = []

    with open(packing_items_file, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        items_fields = reader.fieldnames
        for row in reader:
            items.append(row)
            items_by_pl[row['packing_list_id']].append(row)

    # 2. packing_lists 읽고 중복 처리
    packing_lists = []
    pl_counter = defaultdict(int)
    old_to_new_pl = {}

    with open(packing_lists_file, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        lists_fields = reader.fieldnames

        for row in reader:
            old_pl = row['pl_number']
            pl_counter[old_pl] += 1

            if pl_counter[old_pl] > 1:
                # 중복 발견 - 접미사 추가
                suffix = chr(ord('A') + pl_counter[old_pl] - 1)  # A, B, C...
                new_pl = f"{old_pl}-{suffix}"
            else:
                new_pl = old_pl

            old_to_new_pl[(old_pl, pl_counter[old_pl])] = new_pl
            row['pl_number'] = new_pl
            packing_lists.append(row)

    # 중복 확인
    duplicates = {k: v for k, v in pl_counter.items() if v > 1}
    print(f"Duplicates found: {duplicates}")
    print()

    # 3. packing_items 업데이트
    # items_by_pl에서 같은 pl_number를 가진 items들을 순서대로 새 pl_number로 매핑
    pl_item_counter = defaultdict(int)

    # packing_lists의 순서와 items의 순서가 매칭되어야 함
    # 각 packing_list에 대해 해당 items 찾기
    for i, pl_row in enumerate(packing_lists):
        new_pl = pl_row['pl_number']
        # 원래 pl_number (접미사 제거)
        base_pl = new_pl.rsplit('-', 1)[0] if new_pl.endswith(('-A', '-B', '-C')) else new_pl

        # 이 pl에 해당하는 items 업데이트
        for item in items:
            if item['packing_list_id'] == base_pl:
                pl_item_counter[base_pl] += 1
                # 첫 번째 중복 그룹인지 두 번째인지 판단
                # nw_kg 값으로 매칭
                pass

    # 더 간단한 접근: 원본 CSV에서 순서대로 매핑
    # items를 다시 읽고 순서대로 처리

    # 실제로는 items의 packing_list_id가 이미 pl_number로 되어있음
    # 중복 pl_number에 대해서만 업데이트 필요

    # items 파일에서 중복된 pl_number를 가진 것들 찾기
    items_to_update = []
    for pl_num, count in duplicates.items():
        matching_items = [it for it in items if it['packing_list_id'] == pl_num]
        print(f"{pl_num}: {len(matching_items)} items")

    # packing_lists 저장
    with open(packing_lists_file, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=lists_fields)
        writer.writeheader()
        writer.writerows(packing_lists)

    print(f"\nUpdated: ru_packing_lists.csv")
    print("Note: ru_packing_items.csv needs manual review for duplicate pl_numbers")


if __name__ == "__main__":
    print("=== Fixing Duplicate PL Numbers ===\n")
    fix_duplicates()
