
# SheetOps (Google Sheets + Apps Script + HTML)

- Frontend: `index.html` (React UMD + Tailwind, single file)
- Backend: `apps-script/Code.gs` (Web app JSON API), `apps-script/appsscript.json` (manifest)

## Deploy (Apps Script)
1. สร้างโปรเจกต์ Google Apps Script
2. วางโค้ดจาก `apps-script/Code.gs`
3. Deploy → **Web app** → Execute as: **Me**, Who has access: **Anyone**
4. นำ URL `/exec` ไปตั้งในหน้าเว็บ (มี default แล้ว) หรือ
   ```js
   localStorage.setItem('SHEETOPS_APPS_SCRIPT_URL', 'https://script.google.com/macros/s/AKfycbwEAW_7ervyDdqtdmbqq_g05BILVKyY2jPK3UXhv1TutTk4wmcxNxUkxu6Xoa4ms0r4zQ/exec'); location.reload();
   ```

### จำเป็นต้องมีสิทธิ์
- Spreadsheets, Drive และ External requests (ประกาศใน `appsscript.json` แล้ว)

## Sheets
- `User`: B=ID, C=Name, E=Type
- `Plan`: ต้องมีหัว Station/TaskId และ Assigned (ชื่อคอลัมน์ยืดหยุ่น: station/taskid, assigned/assignedto/พนักงาน/รหัส)
- `ปัญหา`: จะสร้างหัวอัตโนมัติ: `เวลา, รหัส, พนักงาน, งานที่เกี่ยวข้อง, ข้อความ, รูป`
- `KPI`: จะสร้างหัวอัตโนมัติ: ดูในโค้ด

## API ตัวอย่าง (curl)
- รายการปัญหา:
  ```bash
  curl 'https://script.google.com/macros/s/AKfycbwEAW_7ervyDdqtdmbqq_g05BILVKyY2jPK3UXhv1TutTk4wmcxNxUkxu6Xoa4ms0r4zQ/exec?action=list_issues'
  ```
- เปิดเคสแบบ JSON base64 (ไม่แนบรูป):
  ```bash
  curl 'https://script.google.com/macros/s/AKfycbwEAW_7ervyDdqtdmbqq_g05BILVKyY2jPK3UXhv1TutTk4wmcxNxUkxu6Xoa4ms0r4zQ/exec?action=create_issue_base64&taskId=TEST123&message=ping'
  ```
- บันทึกมอบหมายแบบชุด:
  ```bash
  curl -X POST 'https://script.google.com/macros/s/AKfycbwEAW_7ervyDdqtdmbqq_g05BILVKyY2jPK3UXhv1TutTk4wmcxNxUkxu6Xoa4ms0r4zQ/exec' \
    -H 'Content-Type: application/json' \
    -d '{"action":"bulk_set_assignees","items":[{"taskId":"1101","employeeIds":["U001","U002"]}]}'
  ```
- เพิ่ม/อัปเดตพนักงาน (Upsert by ID):
  ```bash
  curl -X POST 'https://script.google.com/macros/s/AKfycbwEAW_7ervyDdqtdmbqq_g05BILVKyY2jPK3UXhv1TutTk4wmcxNxUkxu6Xoa4ms0r4zQ/exec' -H 'Content-Type: application/json' -d '{"action":"append_user","user":{"id":"U999","name":"Tester","type":"Picker"}}'
  ```
- KPI:
  ```bash
  curl -X POST 'https://script.google.com/macros/s/AKfycbwEAW_7ervyDdqtdmbqq_g05BILVKyY2jPK3UXhv1TutTk4wmcxNxUkxu6Xoa4ms0r4zQ/exec' -H 'Content-Type: application/json' -d '{"action":"create_kpi","record":{"User ID":"U001","Date":"2025-08-11","UserName":"Alice"}}'
  curl 'https://script.google.com/macros/s/AKfycbwEAW_7ervyDdqtdmbqq_g05BILVKyY2jPK3UXhv1TutTk4wmcxNxUkxu6Xoa4ms0r4zQ/exec?action=list_kpi&userId=U001&date=2025-08-11'
  ```

## Debug
เปิดหน้าเว็บด้วย `?debug=1` เพื่อดู log ของทุก API call ใน Console
