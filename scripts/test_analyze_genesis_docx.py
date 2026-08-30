import importlib.util
import sys
import unittest
from pathlib import Path

MODULE_PATH = Path(__file__).with_name('analyze-genesis-docx.py')
SPEC = importlib.util.spec_from_file_location('analyze_genesis_docx', MODULE_PATH)
assert SPEC and SPEC.loader
analyzer = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = analyzer
SPEC.loader.exec_module(analyzer)

ANCHOR_PATTERN = analyzer.ANCHOR_PATTERN
anchor_value = analyzer.anchor_value
numeric = analyzer.numeric
parse_location = analyzer.parse_location
parse_locations = analyzer.parse_locations
REFERENCE_PATTERN = analyzer.REFERENCE_PATTERN


class GenesisDocxAnalyzerTest(unittest.TestCase):
    def test_hebrew_numerals(self):
        self.assertEqual(numeric('כ״ד'), 24)
        self.assertEqual(numeric('לא'), 31)

    def test_contiguous_range(self):
        citation = parse_location('משלי', 'ח, כב-לא (דבר החוכמה)')
        self.assertEqual(citation.canonical_ref, 'Proverbs 8:22-31')
        self.assertEqual(citation.selection, {'kind': 'range', 'startVerse': 22, 'endVerse': 31})

    def test_multiple_ranges_become_discrete_verses(self):
        citation = parse_location('תהילים', 'קמח, ב-ג, ה-ו')
        self.assertEqual(citation.canonical_ref, 'Psalms 148:2,3,5,6')
        self.assertEqual(citation.selection, {'kind': 'verses', 'verses': [2, 3, 5, 6]})

    def test_explicit_chapter_prefix_is_not_parsed_as_a_numeral(self):
        citation = parse_location('יואל', 'פרק ג, ה')
        self.assertEqual(citation.canonical_ref, 'Joel 3:5')
        self.assertEqual(citation.selection, {'kind': 'range', 'startVerse': 5})

    def test_bulleted_reference_before_a_quote(self):
        match = REFERENCE_PATTERN.search(' בראשית יב, ח "...וַיִּבֶן שָׁם מִזְבֵּחַ"')
        self.assertIsNotNone(match)
        citation = parse_location(match.group('book'), match.group('location'))
        self.assertEqual(citation.canonical_ref, 'Genesis 12:8')

    def test_cross_chapter_reference_becomes_two_passages(self):
        citations = parse_locations('מלכים א', 'יא, כו + יב, כ')
        self.assertEqual([citation.canonical_ref for citation in citations], ['I Kings 11:26', 'I Kings 12:20'])

    def test_rtl_reversed_parenthesis_anchor(self):
        match = ANCHOR_PATTERN.search('י( וַיִּקְרָא אֱלֹהִים')
        self.assertIsNotNone(match)
        self.assertEqual(anchor_value(match), 10)


if __name__ == '__main__':
    unittest.main()
