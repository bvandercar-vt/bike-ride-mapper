import { Control, DomEvent, DomUtil, control, type Map } from 'leaflet'
Control.TouchHover = Control.extend({
  options: {
    position: 'topleft',
  },

  onAdd: function (map: Map) {
    this._className = 'leaflet-control-touchhover'

    var container = DomUtil.create('div', this._className + ' leaflet-bar')

    this._map = map

    var link = (this._toggleButton = DomUtil.create('a', this._className + '-toggle', container))
    link.href = '#'

    var stop = DomEvent.stopPropagation

    DomEvent.on(link, 'mousedown', stop)
      .on(link, 'dblclick', stop)
      .on(link, 'click', this._toggle, this)

    container.appendChild(link)

    return container
  },

  _toggle: function (e) {
    var toggleClass = this._className + '-toggled'

    if (!this._toggled) {
      DomUtil.addClass(this._toggleButton, toggleClass)
      DomEvent.on(this._map._container, 'touchstart', this._onDown, this)

      this._map.dragging.disable()
      this._map.touchZoom.disable()
    } else {
      DomUtil.removeClass(this._toggleButton, toggleClass)
      DomEvent.off(this._map._container, 'touchstart', this._onDown, this)

      this._map.dragging.enable()
      this._map.touchZoom.enable()
    }

    this._toggled = !this._toggled

    DomEvent.stop(e)
  },

  _onDown: function (e) {
    var first = e.touches[0]

    this._simulateEvent('mouseover', first)
    this._target = first.target

    DomEvent.on(document, 'touchmove', this._onMove, this).on(
      document,
      'touchend',
      this._onUp,
      this,
    )
  },

  _onMove: function (e) {
    var first = e.touches[0]

    var el = document.elementFromPoint(first.screenX, first.screenY)

    if (el !== this._target) {
      this._simulateEvent('mouseout', first, this._target)
      this._simulateEvent('mouseover', first, el)
      this._target = el
    }

    this._simulateEvent('mousemove', first, this._target)
  },

  _onUp: function (e) {
    DomEvent.off(document, 'touchmove', this._onMove, this).off(
      document,
      'touchend',
      this._onUp,
      this,
    )

    this._simulateEvent('mouseout', e.changedTouches[0], this._target)
  },

  _simulateEvent: function (type, e, target) {
    target = target || e.target

    var simulatedEvent = document.createEvent('MouseEvents')
    simulatedEvent.initMouseEvent(
      type,
      true,
      true,
      window,
      1,
      e.screenX,
      e.screenY,
      e.clientX,
      e.clientY,
      false,
      false,
      false,
      false,
      0,
      null,
    )

    target.dispatchEvent(simulatedEvent)
  },
})

control.touchHover = function (options) {
  return new Control.TouchHover(options)
}
