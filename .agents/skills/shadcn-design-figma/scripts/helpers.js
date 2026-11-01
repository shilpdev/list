// Canonical preamble for every use_figma call that creates content in the kit.
// Prepend this block verbatim to the script, then build below it.
// One shared block keeps variable binding and font loading identical across calls;
// ad-hoc rewrites are how font-load crashes and unbound fills creep in.

const cols = await figma.variables.getLocalVariableCollectionsAsync();
const colByName = Object.fromEntries(cols.map(c => [c.name, c.id]));
const allVars = await figma.variables.getLocalVariablesAsync();

// Resolve a variable by collection + name, e.g. V('Mode', 'card'), V('Tailwind', 'spacing/4'), V('Style', 'radius/lg')
const V = (coll, name) => allVars.find(v => v.variableCollectionId === colByName[coll] && v.name === name);

// Solid paint bound to a Mode color role, e.g. node.fills = [boundPaint('card')]
const boundPaint = (role) => figma.variables.setBoundVariableForPaint(
  {type: 'SOLID', color: {r: 0, g: 0, b: 0}}, 'color', V('Mode', role));

const styles = await figma.getLocalTextStylesAsync();

// Text node with a kit text style and a Mode color role.
// Loads BOTH fonts before mutating: the style's font and the fresh node's default font.
// Skipping either throws "Cannot write to node with unloaded font".
async function mkText(chars, styleName, role) {
  const s = styles.find(x => x.name === styleName);
  await figma.loadFontAsync(s.fontName);
  const t = figma.createText();
  await figma.loadFontAsync(t.fontName);
  t.characters = chars;
  await t.setTextStyleIdAsync(s.id);
  t.fills = [boundPaint(role)];
  return t;
}

// Swap the Lucide icon on every IconPlaceholder inside an instance.
// For a component with DIFFERENT left and right icons (leading glyph + trailing chevron),
// do not use setIcon: findAll returns placeholders in left-to-right order, so index them:
//   const ips = inst.findAll(n => n.type === 'INSTANCE' && n.name === 'IconPlaceholder');
//   ips[0].setProperties({[LUCIDE]: leadingId});
//   ips[ips.length - 1].setProperties({[LUCIDE]: trailingId});
const LUCIDE = 'Lucide Icon#21003:4';
const setIcon = (inst, iconId) => inst
  .findAll(n => n.type === 'INSTANCE' && n.name === 'IconPlaceholder')
  .forEach(ip => ip.setProperties({[LUCIDE]: iconId}));
