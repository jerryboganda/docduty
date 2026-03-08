import json
import sqlite3
import sys
from pathlib import Path


def main() -> int:
    if len(sys.argv) != 2:
        print("Usage: sqlite_export.py <sqlite-db-path>", file=sys.stderr)
        return 1

    db_path = Path(sys.argv[1]).resolve()
    if not db_path.exists():
        print(f"SQLite database not found: {db_path}", file=sys.stderr)
        return 1

    conn = sqlite3.connect(f"file:{db_path}?mode=ro", uri=True)
    conn.row_factory = sqlite3.Row
    try:
        table_rows = conn.execute(
            """
            SELECT name
            FROM sqlite_master
            WHERE type = 'table' AND name NOT LIKE 'sqlite_%'
            ORDER BY name
            """
        ).fetchall()

        payload = {"tables": {}}
        for row in table_rows:
            table_name = row["name"]
            rows = conn.execute(f'SELECT * FROM "{table_name}"').fetchall()
            payload["tables"][table_name] = [dict(entry) for entry in rows]

        json.dump(payload, sys.stdout, ensure_ascii=False)
        return 0
    finally:
        conn.close()


if __name__ == "__main__":
    raise SystemExit(main())
