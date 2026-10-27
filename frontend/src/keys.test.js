// Lancer depuis frontend/ : npm test
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { formatKeys, fromKeyboardEvent, isApple } from './keys.js';

const keydown = (key, code = '', modifiers = {}) => ({
  key, code, ctrlKey: false, altKey: false, shiftKey: false, metaKey: false, ...modifiers,
});

test('combinaison au format normalisé', () => {
  assert.equal(fromKeyboardEvent(keydown('P', 'KeyP', { ctrlKey: true, shiftKey: true })), 'Ctrl+Shift+P');
  assert.equal(fromKeyboardEvent(keydown('p', 'KeyP', { metaKey: true, shiftKey: true })), 'Shift+Meta+P');
  assert.equal(fromKeyboardEvent(keydown('F5', 'F5')), 'F5');
  assert.equal(fromKeyboardEvent(keydown(' ', 'Space', { ctrlKey: true })), 'Ctrl+Space');
});

test('modificateur seul ignoré', () => {
  assert.equal(fromKeyboardEvent(keydown('Shift', 'ShiftLeft', { shiftKey: true })), null);
  assert.equal(fromKeyboardEvent(keydown('Meta', 'MetaLeft', { metaKey: true })), null);
});

test('position physique pour les chiffres et avec Alt', () => {
  assert.equal(fromKeyboardEvent(keydown('&', 'Digit1', { ctrlKey: true })), 'Ctrl+1');
  assert.equal(fromKeyboardEvent(keydown('π', 'KeyP', { altKey: true })), 'Alt+P');
});

test('touche à plusieurs majuscules refusée', () => {
  assert.equal(fromKeyboardEvent(keydown('ß', 'Minus', { ctrlKey: true })), null);
});

test('modificateurs choisis à l’écran', () => {
  assert.equal(fromKeyboardEvent(keydown('q', 'KeyQ'), ['Meta']), 'Meta+Q');
  assert.equal(fromKeyboardEvent(keydown('Delete', 'Delete'), ['Alt', 'Ctrl']), 'Ctrl+Alt+Delete');
});

test('affichage en français selon le système', () => {
  assert.equal(formatKeys('Ctrl+Shift+P', false), 'Ctrl + Maj + P');
  assert.equal(formatKeys('Shift+Meta+P', true), 'Maj + Cmd + P');
  assert.equal(formatKeys('Alt+Meta+Escape', false), 'Alt + Win + Échap');
  assert.equal(formatKeys('Alt+ArrowUp', true), 'Option + ↑');
});

test('détection des systèmes Apple', () => {
  assert.equal(isApple('macOS'), true);
  assert.equal(isApple('Win32'), false);
});
