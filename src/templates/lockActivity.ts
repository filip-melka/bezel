import type { TemplateDef } from './types'
import { layoutWidgetTemplate, lockCardAnchor } from './widgetCommon'

// Lock-screen Live Activity: the screenshot (or a placeholder lock screen)
// stays on the screen and the detected card is drawn again on top, enlarged
// around its own position so it runs past the bezel. The overshoot is the
// emphasis.
export const lockActivity: TemplateDef = {
  id: 'lockActivity',
  name: 'Lock activity',
  description: 'Lock-screen Live Activity lifted off the screen, enlarged in place.',
  slots: 1,
  hasText: true,
  widgetKind: 'lockActivity',
  widgetDefaultScale: 1.35,
  limits: {
    scale: [0.85, 1.1],
    deviceOffsetY: [-200, 300],
    textOffsetY: [-80, 120],
    widgetScale: [1, 2],
    widgetOffsetY: [-400, 400],
  },
  layout: (input) => layoutWidgetTemplate(input, lockActivity, { deviceW: 1000, placeholder: 'lock', anchor: lockCardAnchor }),
}
