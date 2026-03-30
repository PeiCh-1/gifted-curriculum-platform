from docx import Document

def dump_file(name):
    print(f"--- {name} ---")
    try:
        d = Document(name)
        for ti, t in enumerate(d.tables):
            print(f"Table {ti}: {len(t.rows)} rows")
            if len(t.rows) > 0:
                for ri, r in enumerate(t.rows):
                    if ri > 5: break
                    row_str = " | ".join([c.text.strip().replace("\n", " ") for c in r.cells])
                    print(f"Row {ri}: {row_str}")
    except Exception as e:
        print(f"Error: {e}")

dump_file("public/curriculum_template.docx")
dump_file("public/igp_template.docx")
