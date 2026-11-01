# Kit inventory: shadcn/ui kit for Figma (PRO)

Verified against the August 2026 kit file (kit 2.2); the September 2026 kit 3.0 refactor changed variable values (Tailwind v4 palette, aliases with opacity), not component or collection IDs. Node IDs and property keys survive file duplication, so they hold in customer copies too. Before trusting this file, verify one entry (fetch the Button set by ID and check its name); if it fails, the file has diverged: fall back to live discovery and update this inventory.

## Variable collections

| Collection | ID | Modes |
|---|---|---|
| Tailwind | `VariableCollectionId:1:2` | Value |
| Style | `VariableCollectionId:1:412` | Nova, Vega, Mira, Luma, Sera, Maia, Rhea, Lyra |
| Mode | `VariableCollectionId:1:444` | Light (`1:7`), Dark (`28:0`) |
| Typeset | `VariableCollectionId:27824:1341` | 14px, 15px, 16px, 18px |

Text styles are named `text-<size>/<leading-normal|leading-none|leading-relaxed|mono>/<weight>`, e.g. `text-sm/leading-normal/semibold`.

## Color model (kit 3.0, `meta/version` = 3.0)

- `Tailwind` `colors/{family}/{step}`: 26 families × 11 steps plus `black`, `white`, `transparent`; values are the sRGB hex of Tailwind CSS v4's oklch palette (kit 2.x carried the v3 hexes).
- `Style` `color/{light,dark}/{token}` (31 base tokens per mode): every value is an alias to a Tailwind variable. Stock styles sit on `neutral` (`colors/neutral/50..950`, `colors/white`, `colors/black`); `destructive` is `red-600` light / `red-400` dark; dark `sidebar-primary` is `blue-700`; light `muted-foreground` is `zinc-500`. Tokens with transparency are aliases with opacity: dark `border` = `colors/white` at 10%, dark `input` = `colors/white` at 15%, dark `ring` = `colors/neutral/500` at 57%, `sidebar-ring` = `neutral-400` / `neutral-600` at 64%.
- `Style` `color/{light,dark}/custom/*` (59 per mode) and `color/{light,dark}/alpha/*` (9 per mode): alias-with-opacity expressions, `{type:'VARIABLE_EXPRESSION', expressionFunction:'COMPOSE_COLOR', expressionArguments:[{type:'VARIABLE_ALIAS', id}, percent]}`, pointing at a base token (`custom/primary-muted` = `primary` at 5%, `custom/focus-ring` = `ring` at 50%, `custom/menu-border` = `foreground` at 10%, `alpha/N` = `background` at (100 - N)%) or, where none matches, at a Tailwind variable (dark `custom/field` = `colors/white` at 5%). Fully transparent values alias `colors/transparent`.
- Literals that remain: `shadow/*`, `inset-shadow/*`, `drop-shadow/*` colors (black at an opacity, by design) and six custom tokens with no matching base (light and dark `custom/secondary-hover`, light and dark `custom/tinted-hover`, dark `custom/tinted`, dark `custom/destructive-ring`).
- `Mode` and `component/*` hold aliases only, as before.

## Core components

| Component | Set/Node ID | Key properties |
|---|---|---|
| Button | `37:931` | `Button Text#37:10`, `Show Left Icon#37:11`, `Show Right Icon#267:0`, `Show KbdGroup#18754:0`, Variant: default/outline/secondary/destructive/ghost/link, State, Size: default/xs/sm/lg/icon/icon-xs/icon-sm/icon-lg. Default Size is `xs`, always set Size explicitly |
| Avatar | `17100:29935` | `Fallback Text#17100:44`, `Show Badge#21123:0`, Type: Image/Fallback/Icon, Size: xl/lg/default/sm/xs |
| Input | `65:533` | `Placeholder Text#65:12`, Variant: Default/File/Password, State |
| Select | `345:11530` | `Placeholder#3001:0`, `Show Icon#17382:0`, State, Size: default/sm |
| Select / Menu | `21473:104411` | `SelectMenu Group#21473:4` (SLOT), Color, Appearance |
| Select Menu / Item | `118:1541` | `Select Item Text#118:1`, Variant: Default/Checkbox, Size |
| Separator | `118:2690` | Orientation: Horizontal/Vertical |
| Card | `21123:292666` | `Card Title#21123:18`, `Card Description#21123:19`, `Card Content#21349:46` (SLOT), `Card Footer Content#21349:49` (SLOT), `Card Header Content#28514:0` (SLOT), header/footer/description booleans, Size: default/sm |
| Item | `18672:198607` | `Title Text#18672:30`, `Description Text#18672:31`, show booleans, `Flex#21466:0` (SLOT), Variant: default/muted/outline, Size |
| ItemGroup | `18672:218902` | `Items#21410:40` (SLOT) |
| Kbd | `18665:781` | `Text#18665:5`, icon booleans, Background: Default/Primary |
| KbdGroup | `18665:995` | `Items#27929:2` (SLOT) |
| Tabs | `21133:27311` | `Items#21408:6` (SLOT), Variant: Default/Line, Orientation |
| Tabs / Trigger | `183:532` | `Tab Text#183:21`, `Show Icon#753:3`, Variant, Active: On/Off, State |
| Aspect Ratio | `28:1540` | Ratio: 1/1, 4/3, 16/9, 21/9, and more |
| ShadcnDesign Logo | `753:25930` | Color: Default |

## Sidebar components

| Component | Set ID | Key properties |
|---|---|---|
| Sidebar / SidebarMenuButton | `5198:1113` | `Text#3278:82`, `Icon#3281:0`, `Dropdown#3281:44`, `Subtitle#3281:45`, `2nd Icon#21436:0`, `Media#3281:304` (INSTANCE_SWAP), Type: Simple/Collapsible/Dropdown/Tree/Badge/Big Icon/Checkbox, State: Default/Hover/Active/Focused, Collapsed |
| Sidebar / SidebarGroupLabel | `5198:1398` | `Label#3278:69`, Type, State, Text Size: sm/xs |
| Sidebar / SidebarGroup | `5198:1528` | `Label#3281:352`, `Items#21352:26` (SLOT), Collapsed |
| Sidebar / SidebarMenuSub | `5198:1446` | `Items#21352:14` (SLOT), Type |

## IconPlaceholder

Component `21003:91178`. One nested icon instance per library; visibility bound to `icon-library/*` booleans. Swap props:

| Library | Swap property key | Library page ID |
|---|---|---|
| Lucide | `Lucide Icon#21003:4` | `1:433` |
| Tabler | `Tabler Icon#21003:1` | `21001:21` |
| HugeIcons | `HugeIcon#21003:3` | `21003:9` |
| Phosphor | `Phosphor Icon#21003:2` | `21003:9075` |
| Remix | `Remix Icon#21038:0` | `21033:57` |

Icon components are named `<Library> Icon / <PascalCaseName>` with no separators inside the name part: `Lucide Icon / ChevronDown`, not `chevron-down`. To match a kebab-case icon name, lowercase it and strip hyphens. Resolve every icon a design needs in one `findAllWithCriteria({types:['COMPONENT']})` pass over the library page and return the ID map; repeated lookup calls waste a round trip each.

## Component page IDs (frequently used)

Button `34:6`, Avatar `23:988`, Input `65:520`, Select `118:1264`, Separator `118:2682`, Card `46:65`, Item `18672:6033`, Kbd `18665:239`, Tabs `183:417`, Sidebar `5143:200`, Aspect Ratio `21:535`, Utility Components `40:153`, Icons (IconPlaceholder) `21003:22055`.
