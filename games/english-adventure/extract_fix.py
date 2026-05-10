"""Re-extract PDFs with adjusted settings.

PDFs are in content/grade4/ (relative to project root).
Run from project root: python3 games/english-adventure/extract_fix.py
"""
import pdfplumber
import os

PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONTENT = os.path.join(PROJECT_ROOT, "content", "grade4")
os.chdir(CONTENT)

# Re-extract 知识总结 with adjusted tolerance
print("Re-extracting 知识总结 with adjusted settings...")
with pdfplumber.open("新外研四下-单元重点知识总结.pdf") as pdf:
    with open("新外研四下-单元重点知识总结_v2.txt", "w", encoding="utf-8") as out:
        for i, page in enumerate(pdf.pages):
            text = page.extract_text(x_tolerance=2, y_tolerance=2)
            if text:
                out.write(f"\n--- Page {i+1} ---\n")
                out.write(text)
            else:
                out.write(f"\n--- Page {i+1} (no text) ---\n")
print("Done 知识总结 v2")

# Re-extract 单词表 with tighter tolerance
print("Re-extracting 单词表 with adjusted settings...")
with pdfplumber.open("新外研四下单词表带音标.pdf") as pdf:
    with open("新外研四下单词表带音标_v2.txt", "w", encoding="utf-8") as out:
        for i, page in enumerate(pdf.pages):
            text = page.extract_text(x_tolerance=2, y_tolerance=2)
            if text:
                out.write(f"\n--- Page {i+1} ---\n")
                out.write(text)
            else:
                out.write(f"\n--- Page {i+1} (no text) ---\n")
print("Done 单词表 v2")
