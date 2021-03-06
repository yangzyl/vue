/* @flow */

import { cached } from 'shared/util'
import { warn } from 'core/util/index'

const normalizeEvent = cached((name: string): {
  name: string,
  once: boolean,
  capture: boolean
} => {
  const once = name.charAt(0) === '~' // Prefixed last, checked first
  name = once ? name.slice(1) : name
  const capture = name.charAt(0) === '!'
  name = capture ? name.slice(1) : name
  return {
    name,
    once,
    capture
  }
})

function createEventHandle (fn: Function | Array<Function>): {
  fn: Function | Array<Function>;
  invoker: Function;
} {
  const handle = {
    fn,
    invoker: function () {
      const fn = handle.fn
      if (Array.isArray(fn)) {
        for (let i = 0; i < fn.length; i++) {
          fn[i].apply(null, arguments)
        }
      } else {
        // return handler return value for single handlers
        return fn.apply(null, arguments)
      }
    }
  }
  return handle
}

export function updateListeners (
  on: Object,
  oldOn: Object,
  add: Function,
  remove: Function,
  vm: Component
) {
  let name, cur, old, event
  for (name in on) {
    cur = on[name]
    old = oldOn[name]
    event = normalizeEvent(name)
    if (!cur) {
      process.env.NODE_ENV !== 'production' && warn(
        `Invalid handler for event "${event.name}": got ` + String(cur),
        vm
      )
    } else if (!old) {
      if (!cur.invoker) {
        cur = on[name] = createEventHandle(cur)
      }
      add(event.name, cur.invoker, event.once, event.capture)
    } else if (cur !== old) {
      old.fn = cur
      on[name] = old
    }
  }
  for (name in oldOn) {
    if (!on[name]) {
      event = normalizeEvent(name)
      remove(event.name, oldOn[name].invoker, event.capture)
    }
  }
}
