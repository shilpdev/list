// Dark-mode duplicate: the only correct way to produce or verify a dark version.
// Never repaint colors by hand. Set `frame` to the finished light frame first.
// If the user asked for a dark version, keep the duplicate and rename it;
// otherwise delete it after the screenshot so the page holds exactly what was requested.

const dup = frame.clone();
figma.currentPage.appendChild(dup);
dup.x = frame.x;
dup.y = frame.y + frame.height + 100;
const modeCol = (await figma.variables.getLocalVariableCollectionsAsync())
  .find(c => c.name === 'Mode');
dup.setExplicitVariableModeForCollection(modeCol, modeCol.modes.find(m => m.name === 'Dark').modeId);
await dup.screenshot();
// dup.remove();  // when it was only a verification check
