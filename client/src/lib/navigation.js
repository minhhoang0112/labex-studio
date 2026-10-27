// Each history entry owns its return destination and scroll position.
// Keeping this in history.state also survives a reload without crossing tabs.
export function createNavigation(win) {
  const path = () => win.location.pathname + win.location.search;
  const read = () => win.history.state?.labexNavigation;
  const write = value => win.history.replaceState({ ...win.history.state, labexNavigation: value }, '', path());
  if (!read()) write({ index: 0, path: path(), scroll: 0, parent: null });
  const save = () => write({ ...read(), path: path(), scroll: win.scrollY });
  return {
    save,
    current: read,
    open(destination, { sibling = false } = {}) {
      save();
      const current = read();
      win.history.pushState({ labexNavigation: {
        index: current.index + 1, path: destination, scroll: 0,
        parent: sibling ? current.parent : { index: current.index, path: current.path },
      } }, '', destination);
    },
    back(fallback) {
      const current = read();
      if (current?.parent && current.parent.index < current.index) {
        win.history.go(current.parent.index - current.index);
        return true;
      }
      save();
      win.history.replaceState({ labexNavigation: { index: current?.index || 0, path: fallback, scroll: 0, parent: null } }, '', fallback);
      return false;
    },
  };
}

export function courseBackPath(course) {
  return course?.topic === 'windows' ? '/paths/windows' : '/learn';
}
