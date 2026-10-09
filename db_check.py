import sqlite3, json

db = sqlite3.connect(r"server/data/canteen.db")
tables = db.execute("SELECT name FROM sqlite_master WHERE type='table' AND (name='orders' OR name LIKE '%temperature%')").fetchall()
cols = db.execute("PRAGMA table_info(orders)").fetchall()
rows = db.execute("SELECT id, verification_token FROM orders LIMIT 3").fetchall()
print(json.dumps({
    "tables": tables,
    "cols": [c[1] for c in cols],
    "sampleRows": [{"id": r[0], "verification_token": r[1]} for r in rows],
}, indent=2))
db.close()
