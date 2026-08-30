#!/usr/bin/env python3
"""Read-only structural analysis of the private Genesis ripple DOCX.

The script never edits the source document or writes to Firebase. It emits a
private JSON inventory and a concise Markdown report to paths supplied by the
operator. Generated artifacts intentionally live outside the repository.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import zipfile
import unicodedata
from collections import Counter, defaultdict
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any
from xml.etree import ElementTree as ET

W = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"

BOOKS: dict[str, tuple[str, int]] = {
    "בראשית": ("Genesis", 1), "שמות": ("Exodus", 2), "ויקרא": ("Leviticus", 3),
    "במדבר": ("Numbers", 4), "דברים": ("Deuteronomy", 5), "יהושע": ("Joshua", 6),
    "שופטים": ("Judges", 7), "שמואל א": ("I Samuel", 8), "שמואל ב": ("II Samuel", 9),
    "מלכים א": ("I Kings", 10), "מלכים ב": ("II Kings", 11), "ישעיהו": ("Isaiah", 12),
    "ירמיהו": ("Jeremiah", 13), "יחזקאל": ("Ezekiel", 14), "הושע": ("Hosea", 15),
    "יואל": ("Joel", 16), "עמוס": ("Amos", 17), "עובדיה": ("Obadiah", 18),
    "יונה": ("Jonah", 19), "מיכה": ("Micah", 20), "נחום": ("Nahum", 21),
    "חבקוק": ("Habakkuk", 22), "צפניה": ("Zephaniah", 23), "חגי": ("Haggai", 24),
    "זכריה": ("Zechariah", 25), "מלאכי": ("Malachi", 26), "תהילים": ("Psalms", 27),
    "תהלים": ("Psalms", 27), "משלי": ("Proverbs", 28), "איוב": ("Job", 29),
    "שיר השירים": ("Song of Songs", 30), "רות": ("Ruth", 31), "איכה": ("Lamentations", 32),
    "קהלת": ("Ecclesiastes", 33), "אסתר": ("Esther", 34), "דניאל": ("Daniel", 35),
    "עזרא": ("Ezra", 36), "נחמיה": ("Nehemiah", 37),
    "דברי הימים א": ("I Chronicles", 38), "דברי הימים ב": ("II Chronicles", 39),
}

HEBREW_VALUES = {
    "א": 1, "ב": 2, "ג": 3, "ד": 4, "ה": 5, "ו": 6, "ז": 7, "ח": 8, "ט": 9,
    "י": 10, "כ": 20, "ך": 20, "ל": 30, "מ": 40, "ם": 40, "נ": 50, "ן": 50,
    "ס": 60, "ע": 70, "פ": 80, "ף": 80, "צ": 90, "ץ": 90, "ק": 100, "ר": 200,
    "ש": 300, "ת": 400,
}

BOOK_PATTERN = "|".join(re.escape(book) for book in sorted(BOOKS, key=len, reverse=True))
REFERENCE_PATTERN = re.compile(rf"(?P<book>{BOOK_PATTERN})\s+(?P<location>[^:\n]{{1,28}}):")
CHAPTER_PATTERN = re.compile(r"בראשית\s*,?\s*פרק\s+([א-ת0-9׳״\"']+)")
ANCHOR_PATTERN = re.compile(r"(?:^|[\s•])(?:\(([א-ת]{1,3})\)|([א-ת]{1,3})\)|([א-ת]{1,3})\()\s*")
UNCERTAINTY_TERMS = re.compile(r"לא סגור|להמשך מחשבה|להביא\?|לבדוק|להסתכל|אולי|נוטה ללא|לא בטוח")
GENESIS_VERSE_COUNTS = [
    0, 31, 25, 24, 26, 32, 22, 24, 22, 29, 32, 32, 20, 18, 24, 21, 16, 27, 33, 38,
    18, 34, 24, 20, 67, 34, 35, 46, 22, 35, 43, 55, 32, 20, 31, 29, 43, 36, 30, 23,
    23, 57, 38, 34, 34, 28, 34, 31, 22, 33, 26,
]


@dataclass
class Citation:
    raw: str
    book_he: str
    canonical_ref: str | None
    chapter: int | None
    selection: dict[str, Any] | None
    error: str | None = None


@dataclass
class Paragraph:
    index: int
    text: str
    chapter: int | None
    highlights: list[str]
    yellow_text: str
    italic_text: str
    bold_text: str
    anchor_markers: list[int]
    citations: list[Citation]
    uncertainty: bool


def numeric(token: str) -> int | None:
    cleaned = re.sub(r"[^א-ת0-9]", "", token)
    if not cleaned:
        return None
    if cleaned.isdigit():
        return int(cleaned)
    return sum(HEBREW_VALUES.get(char, 0) for char in cleaned) or None


def without_marks(text: str) -> str:
    return "".join(char for char in unicodedata.normalize("NFD", text) if unicodedata.category(char) != "Mn")


def anchor_value(match: re.Match[str]) -> int | None:
    return numeric(next(group for group in match.groups() if group is not None))


def parse_location(book_he: str, raw_location: str) -> Citation:
    location = re.sub(r"\s+", " ", raw_location.strip(" [].,;"))
    location = re.sub(r"\s*\([^)]*\)\s*$", "", location).strip()
    parts = [part.strip() for part in re.split(r"\s*,\s*|\s+", location) if part.strip()]
    if len(parts) < 2:
        return Citation(f"{book_he} {raw_location}:", book_he, None, None, None, "missing chapter or verse")
    chapter = numeric(parts[0])
    verse_tokens = parts[1:]
    if chapter is None:
        return Citation(f"{book_he} {raw_location}:", book_he, None, None, None, "invalid chapter")
    verses: list[int] = []
    range_match = re.fullmatch(r"([א-ת0-9׳״\"']+)\s*[-–]\s*([א-ת0-9׳״\"']+)", verse_tokens[0])
    if range_match and len(verse_tokens) == 1:
        start, end = numeric(range_match.group(1)), numeric(range_match.group(2))
        if start and end:
            selection = {"kind": "range", "startVerse": start, "endVerse": end}
            english = BOOKS[book_he][0]
            return Citation(f"{book_he} {raw_location}:", book_he, f"{english} {chapter}:{start}-{end}", chapter, selection)
    for token in verse_tokens:
        token_range = re.fullmatch(r"([א-ת0-9׳״\"']+)\s*[-–]\s*([א-ת0-9׳״\"']+)", token)
        if token_range:
            start, end = numeric(token_range.group(1)), numeric(token_range.group(2))
            if start is None or end is None or end < start:
                return Citation(f"{book_he} {raw_location}:", book_he, None, chapter, None, f"invalid verse range: {token}")
            verses.extend(range(start, end + 1))
        else:
            value = numeric(token)
            if value is None:
                return Citation(f"{book_he} {raw_location}:", book_he, None, chapter, None, f"invalid verse token: {token}")
            verses.append(value)
    if not verses:
        return Citation(f"{book_he} {raw_location}:", book_he, None, chapter, None, "missing verse")
    selection = {"kind": "range", "startVerse": verses[0]} if len(verses) == 1 else {"kind": "verses", "verses": verses}
    suffix = str(verses[0]) if len(verses) == 1 else ",".join(map(str, verses))
    return Citation(f"{book_he} {raw_location}:", book_he, f"{BOOKS[book_he][0]} {chapter}:{suffix}", chapter, selection)


def property_enabled(properties: ET.Element | None, tag: str) -> bool:
    if properties is None:
        return False
    node = properties.find(f"{W}{tag}")
    return node is not None and node.get(f"{W}val", "1") not in {"0", "false", "off"}


def read_paragraphs(docx_path: Path) -> list[Paragraph]:
    with zipfile.ZipFile(docx_path) as archive:
        root = ET.fromstring(archive.read("word/document.xml"))
    paragraphs: list[Paragraph] = []
    current_chapter: int | None = None
    content_started = False
    for index, paragraph in enumerate(root.iter(f"{W}p"), start=1):
        fragments: list[str] = []
        yellow_fragments: list[str] = []
        italic_fragments: list[str] = []
        bold_fragments: list[str] = []
        highlights: Counter[str] = Counter()
        for run in paragraph.iter(f"{W}r"):
            text = "".join(node.text or "" for node in run.iter(f"{W}t"))
            if not text:
                continue
            fragments.append(text)
            properties = run.find(f"{W}rPr")
            highlight = properties.find(f"{W}highlight") if properties is not None else None
            color = highlight.get(f"{W}val") if highlight is not None else None
            if color:
                highlights[color] += len(text.strip())
            if color == "yellow":
                yellow_fragments.append(text)
            if property_enabled(properties, "i") or property_enabled(properties, "iCs"):
                italic_fragments.append(text)
            if property_enabled(properties, "b") or property_enabled(properties, "bCs"):
                bold_fragments.append(text)
        text = re.sub(r"\s+", " ", "".join(fragments)).strip()
        if not text:
            continue
        if "סרטון הדגמה" in text:
            content_started = True
        chapter_match = CHAPTER_PATTERN.search(text)
        if chapter_match:
            current_chapter = numeric(chapter_match.group(1))
        raw_anchors = [anchor_value(match) for match in ANCHOR_PATTERN.finditer(text)]
        if content_started and current_chapter is None and 1 in raw_anchors and "בראשית" in without_marks(text):
            current_chapter = 1
        max_verse = GENESIS_VERSE_COUNTS[current_chapter] if current_chapter and current_chapter < len(GENESIS_VERSE_COUNTS) else 50
        anchors = [value for value in raw_anchors if value is not None and 1 <= value <= max_verse]
        citations = [parse_location(match.group("book"), match.group("location")) for match in REFERENCE_PATTERN.finditer(text)]
        paragraphs.append(Paragraph(
            index=index,
            text=text,
            chapter=current_chapter if content_started else None,
            highlights=sorted(highlights),
            yellow_text=re.sub(r"\s+", " ", "".join(yellow_fragments)).strip(),
            italic_text=re.sub(r"\s+", " ", "".join(italic_fragments)).strip(),
            bold_text=re.sub(r"\s+", " ", "".join(bold_fragments)).strip(),
            anchor_markers=anchors,
            citations=citations,
            uncertainty=bool(UNCERTAINTY_TERMS.search(text)),
        ))
    return paragraphs


def build_groups(paragraphs: list[Paragraph]) -> list[dict[str, Any]]:
    groups: list[dict[str, Any]] = []
    current: dict[str, Any] | None = None
    for paragraph in paragraphs:
        if paragraph.chapter is None:
            continue
        if paragraph.anchor_markers:
            if current:
                groups.append(current)
            current = {
                "chapter": paragraph.chapter,
                "anchorVerses": paragraph.anchor_markers,
                "paragraphIndexes": [paragraph.index],
                "citations": [asdict(item) for item in paragraph.citations],
                "hasYellow": bool(paragraph.yellow_text),
                "hasUncertainty": paragraph.uncertainty,
                "flags": ["multiple-anchor-markers"] if len(paragraph.anchor_markers) > 1 else [],
            }
        elif current and paragraph.chapter == current["chapter"]:
            current["paragraphIndexes"].append(paragraph.index)
            current["citations"].extend(asdict(item) for item in paragraph.citations)
            current["hasYellow"] = current["hasYellow"] or bool(paragraph.yellow_text)
            current["hasUncertainty"] = current["hasUncertainty"] or paragraph.uncertainty
    if current:
        groups.append(current)
    for group in groups:
        if not group["citations"]:
            group["flags"].append("no-citations-detected")
        if any(item["error"] for item in group["citations"]):
            group["flags"].append("citation-parse-error")
        if group["hasUncertainty"]:
            group["flags"].append("editorial-uncertainty")
    return groups


def markdown_report(source: Path, digest: str, paragraphs: list[Paragraph], groups: list[dict[str, Any]]) -> str:
    content = [item for item in paragraphs if item.chapter is not None]
    citations = [citation for item in content for citation in item.citations]
    by_chapter: dict[int, dict[str, int]] = defaultdict(lambda: defaultdict(int))
    for group in groups:
        chapter = by_chapter[group["chapter"]]
        chapter["groups"] += 1
        chapter["citations"] += len(group["citations"])
        chapter["yellow"] += int(group["hasYellow"])
        chapter["flagged"] += int(bool(group["flags"]))
    errors = [item for item in citations if item.error]
    relationship_groups = [group for group in groups if group["citations"]]
    ready_groups = [group for group in relationship_groups if group["hasYellow"] and not group["flags"]]
    lines = [
        "# דוח Dry Run — אדוות בראשית",
        "",
        f"- מקור: `{source.name}`",
        f"- SHA-256: `{digest}`",
        f"- פסקאות במסמך: {len(paragraphs)}",
        f"- פסקאות באזור התוכן המזוהה: {len(content)}",
        f"- קבוצות עוגן מועמדות: {len(groups)}",
        f"- קבוצות עם מקור מקביל אחד לפחות: {len(relationship_groups)}",
        f"- קבוצות במבנה בסיסי נקי: {len(ready_groups)}",
        f"- מראי מקום שזוהו: {len(citations)}",
        f"- מראי מקום שנורמלו: {len(citations) - len(errors)}",
        f"- שגיאות נרמול: {len(errors)}",
        "",
        "## לפי פרק",
        "",
        "| פרק | קבוצות מועמדות | קבוצות עם צהוב | מראי מקום | קבוצות לבדיקה |",
        "|---:|---:|---:|---:|---:|",
    ]
    for chapter in sorted(by_chapter):
        stats = by_chapter[chapter]
        lines.append(f"| {chapter} | {stats['groups']} | {stats['yellow']} | {stats['citations']} | {stats['flagged']} |")
    lines.extend(["", "## חריגים המחייבים בדיקה", ""])
    flagged = [group for group in groups if group["flags"]]
    for group in flagged[:100]:
        anchors = ", ".join(map(str, group["anchorVerses"]))
        lines.append(f"- בראשית {group['chapter']}:{anchors} — {', '.join(group['flags'])} (פסקאות {group['paragraphIndexes'][0]}–{group['paragraphIndexes'][-1]})")
    if len(flagged) > 100:
        lines.append(f"- ועוד {len(flagged) - 100} קבוצות; הרשימה המלאה נמצאת ב־JSON.")
    lines.extend(["", "## מגבלות ה־dry run", "", "- זהו ניתוח מבני בלבד; לא נכתבו נתונים ל־Firestore.", "- צהוב נשמר כאות אישור, אך אינו מומר אוטומטית לאדווה עד אימות גבולות הקבוצה.", "- פסקאות עם כמה מספרי פסוקים או ניסוחי לבט מסומנות לבדיקה אנושית.", "- הטקסט המקראי הסופי יגיע מספריא; המסמך משמש להגדרת היחסים וההערות בלבד.", ""])
    return "\n".join(lines)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("docx", type=Path)
    parser.add_argument("--json", required=True, type=Path)
    parser.add_argument("--report", required=True, type=Path)
    args = parser.parse_args()
    source = args.docx.resolve()
    digest = hashlib.sha256(source.read_bytes()).hexdigest()
    paragraphs = read_paragraphs(source)
    groups = build_groups(paragraphs)
    payload = {
        "source": {"filename": source.name, "sha256": digest},
        "summary": {"paragraphs": len(paragraphs), "candidateGroups": len(groups)},
        "paragraphs": [{**asdict(item), "citations": [asdict(citation) for citation in item.citations]} for item in paragraphs],
        "candidateGroups": groups,
    }
    args.json.parent.mkdir(parents=True, exist_ok=True)
    args.report.parent.mkdir(parents=True, exist_ok=True)
    args.json.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    args.report.write_text(markdown_report(source, digest, paragraphs, groups), encoding="utf-8")
    print(f"Wrote private inventory to {args.json}")
    print(f"Wrote dry-run report to {args.report}")


if __name__ == "__main__":
    main()
