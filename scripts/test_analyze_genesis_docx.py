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

    def test_rtl_reversed_parenthesis_anchor(self):
        match = ANCHOR_PATTERN.search('י( וַיִּקְרָא אֱלֹהִים')
        self.assertIsNotNone(match)
        self.assertEqual(anchor_value(match), 10)


if __name__ == '__main__':
    unittest.main()
