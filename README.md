
# SheetOps — Floor Plan + Issues (Google Sheets + Apps Script)

- **Frontend:** `index.html` (React UMD + Tailwind) — เปิดด้วยไฟล์เดียว
- **Backend:** `apps-script/Code.gs` — วางใน Google Apps Script แล้ว Deploy (Web app)

## Quick start

1. เปิด Google Apps Script → สร้างโปรเจกต์ → วางโค้ดจาก `apps-script/Code.gs`
2. Deploy → **Web app** → Who has access: **Anyone** → นำ URL `/exec` มาใช้
3. เปิด `index.html` ในเบราว์เซอร์
   - ตั้งค่า (ถ้าต้องการ) ผ่าน `localStorage`:
     - `SHEETOPS_APPS_SCRIPT_URL` = `https://script.google.com/macros/s/.../exec`

### Sheets Required
- `User` — คอลัมน์ B=ID, C=Name, E=Type
- `Plan` — มีคอลัมน์ Station/TaskId และ Assigned
- `ปัญหา` — จะถูกสร้างหัวอัตโนมัติเป็น `เวลา, รหัส, พนักงาน, งานที่เกี่ยวข้อง, ข้อความ, รูป`

## API (Apps Script)

- `list_sheets`, `create_sheet`, `delete_sheet`, `rename_sheet`
- `append_row`, `update_row`, `delete_row`, `upsert_by_key`
- `get_values`, `set_values`
- Domain: `set_assignees`, `append_user`, `delete_user`
- Issues: `create_issue_base64`, `list_issues`
- AI: `ai_chat` (ต้องใส่ `OPENAI_API_KEY` ใน Script properties)

## Debug
เปิดหน้าเว็บด้วย `?debug=1` เพื่อดู log ของคำขอ API ใน Console

