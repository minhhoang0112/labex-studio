import test from 'node:test';
import assert from 'node:assert/strict';
import { createNavigation, courseBackPath } from '../client/src/lib/navigation.js';

function browser(path = '/paths/windows') {
  const entries = [{ state: null, path }]; let index = 0;
  const win = { scrollY: 0, location: {}, history: {
    get state() { return entries[index].state; },
    replaceState(state, _, path) { entries[index] = { state, path: path || entries[index].path }; sync(); },
    pushState(state, _, path) { entries.splice(++index); entries.push({ state, path }); sync(); },
    go(delta) { index += delta; sync(); },
  } };
  function sync() { const url = new URL(entries[index].path, 'http://localhost'); win.location = { pathname: url.pathname, search: url.search }; }
  sync(); return win;
}
test('roadmap → course → successive labs returns to course then original roadmap and scroll, including reload', () => {
  const win = browser(); let nav = createNavigation(win);
  win.scrollY = 1600;
  nav.open('/courses/windows-11-it-support-troubleshooting');
  win.scrollY = 640;
  nav.open('/labs/a?courseId=windows-11-it-support-troubleshooting');
  win.scrollY = 0;
  nav.open('/labs/b?courseId=windows-11-it-support-troubleshooting', { sibling: true });
  nav = createNavigation(win); // reload keeps original history ownership
  assert.equal(nav.back('/learn'), true);
  assert.equal(win.location.pathname, '/courses/windows-11-it-support-troubleshooting');
  assert.equal(nav.current().scroll, 640);
  assert.equal(nav.back('/learn'), true);
  assert.equal(win.location.pathname, '/paths/windows');
  assert.equal(nav.current().scroll, 1600);
});
test('direct course links fall back to Windows roadmap, not unrelated browser history', () => {
  const win = browser('/courses/windows-11-fundamentals');
  const nav = createNavigation(win);
  assert.equal(nav.back(courseBackPath({ topic: 'windows' })), false);
  assert.equal(win.location.pathname, '/paths/windows');
});
test('saving scroll preserves page filters; browser back and forward keep independent entries', () => {
  const win = browser('/learn'); const nav = createNavigation(win);
  win.history.replaceState({ ...win.history.state, pageState: { topic: 'windows', page: 2 } }, '');
  win.scrollY = 900; nav.open('/courses/windows-11-fundamentals');
  win.history.go(-1);
  assert.deepEqual(win.history.state.pageState, { topic: 'windows', page: 2 });
  assert.equal(nav.current().scroll, 900);
  win.history.go(1);
  assert.equal(nav.current().scroll, 0);
});
