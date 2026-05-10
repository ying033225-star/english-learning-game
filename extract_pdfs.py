"""Extract text from all 4 PDFs using pdfplumber"""
import pdfplumber
import os

pdfs = [
    "新外研四下-单元重点知识总结.pdf",
    "新外研四下单词表带音标.pdf",
    "新外研四下英语课堂笔记.pdf",
    "新外研英语四下课文逐句翻译.pdf",
]

os.chdir("/Users/ly/cc-test")

for pdf_name in pdfs:
    txt_name = pdf_name.replace(".pdf", ".txt")
    print(f"\n{'='*60}")
    print(f"Extracting: {pdf_name}")
    print(f"{'='*60}")

    try:
        with pdfplumber.open(pdf_name) as pdf:
            total_pages = len(pdf.pages)
            print(f"Total pages: {total_pages}")

            with open(txt_name, "w", encoding="utf-8") as out:
                for i, page in enumerate(pdf.pages):
                    text = page.extract_text()
                    if text:
                        out.write(f"\n--- Page {i+1} ---\n")
                        out.write(text)
                    else:
                        out.write(f"\n--- Page {i+1} (no text) ---\n")

                    if (i + 1) % 10 == 0:
                        print(f"  Processed {i+1}/{total_pages} pages...")

            # Check file size
            size_kb = os.path.getsize(txt_name) / 1024
            print(f"  Done! Output: {txt_name} ({size_kb:.1f} KB)")

    except Exception as e:
        print(f"  ERROR: {e}")

print("\nDone!")
