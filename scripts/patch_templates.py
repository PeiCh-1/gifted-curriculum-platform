import sys
import os
from docx import Document
from docx.shared import RGBColor

def patch_curriculum(path):
    if not os.path.exists(path):
        print(f"Error: Template not found at {path}")
        return
    
    doc = Document(path)
    # 僅針對表格中的 Indicators 欄位執行「樣式注入」
    for t in doc.tables:
        if len(t.rows) >= 6:
            row5 = t.rows[5]
            # --- 重新注入帶有樣式的標籤 ---
            cell = row5.cells[1]
            cell.text = "" # 清空原文字以注入精確樣式
            p = cell.paragraphs[0]
            p.add_run("{#IndRuns}{#isAdd}")
            r_add = p.add_run("{text}")
            r_add.font.color.rgb = RGBColor(0xFF, 0x00, 0x00) # 設為紅字樣式
            p.add_run("{/isAdd}{#isDel}")
            r_del = p.add_run("{text}")
            r_del.font.color.rgb = RGBColor(0xFF, 0x00, 0x00) # 設為紅字樣式
            r_del.font.strike = True # 設為刪除線樣式
            p.add_run("{/isDel}{^isAdd}{^isDel}{text}{/isDel}{/isAdd}{/IndRuns}")
            print(f"Patched Styles in {path} Indicators cell.")
    
    doc.save(path)

def patch_igp(path):
    if not os.path.exists(path):
        return
    doc = Document(path)
    for t in doc.tables:
        if len(t.rows) >= 3:
            row2 = t.rows[2]
            cell = row2.cells[1]
            cell.text = ""
            p = cell.paragraphs[0]
            p.add_run("{#IndRuns}{#isAdd}")
            r_add = p.add_run("{text}")
            r_add.font.color.rgb = RGBColor(0xFF, 0x00, 0x00)
            p.add_run("{/isAdd}{#isDel}")
            r_del = p.add_run("{text}")
            r_del.font.color.rgb = RGBColor(0xFF, 0x00, 0x00)
            r_del.font.strike = True
            p.add_run("{/isDel}{^isAdd}{^isDel}{text}{/isDel}{/isAdd}{/IndRuns}")
            print(f"Patched Styles in {path} IGP Indicators cell.")
    doc.save(path)

if __name__ == "__main__":
    patch_curriculum('public/curriculum_template.docx')
    patch_igp('public/igp_template.docx')
