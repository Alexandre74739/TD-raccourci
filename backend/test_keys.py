"""Lancer depuis la racine du dépôt : python -m unittest discover backend"""
import unittest

from keys import InvalidKeys, normalize_keys


class NormalizeKeysTest(unittest.TestCase):
    def test_french_names(self):
        self.assertEqual(normalize_keys("Ctrl + Maj + P"), "Ctrl+Shift+P")
        self.assertEqual(normalize_keys("Échap"), "Escape")

    def test_modifiers_order(self):
        self.assertEqual(normalize_keys("maj+ctrl+p"), "Ctrl+Shift+P")
        self.assertEqual(normalize_keys("Cmd + Maj + P"), "Shift+Meta+P")

    def test_named_keys(self):
        self.assertEqual(normalize_keys("F5"), "F5")
        self.assertEqual(normalize_keys("Alt + ↑"), "Alt+ArrowUp")
        self.assertEqual(normalize_keys("Ctrl + Plus"), "Ctrl+Plus")

    def test_invalid_combinations(self):
        for value in ("", "Ctrl", "Ctrl + K + S", "Ctrl ++", "Ctrl + Ctrl + A", "Truc + A"):
            with self.subTest(value=value), self.assertRaises(InvalidKeys):
                normalize_keys(value)


if __name__ == "__main__":
    unittest.main()
