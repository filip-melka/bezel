import type { TemplateDef } from './types'
import { islandAnchor, layoutWidgetTemplate } from './widgetCommon'

// Expanded Dynamic Island: same treatment as the lock card. The screenshot
// (or a placeholder home screen) stays on the device and the island is drawn
// again enlarged around its own position, overshooting the bezel.
export const island: TemplateDef = {
  id: 'island',
  name: 'Island',
  description: 'Expanded Dynamic Island lifted off the screen, enlarged in place.',
  slots: 1,
  hasText: true,
  widgetKind: 'island',
  widgetDefaultScale: 1.35,
  limits: {
    scale: [0.85, 1.1],
    deviceOffsetY: [-200, 300],
    textOffsetY: [-80, 120],
    widgetScale: [1, 2],
    widgetOffsetY: [-400, 400],
  },
  layout: (input) => layoutWidgetTemplate(input, island, { deviceW: 1000, placeholder: 'home', anchor: islandAnchor }),
}
