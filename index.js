const {watch} = require('fs')

const reloadingWrappers = {}


module.exports = function upgradeToUpdate(require) {
  function watchfulRequire(module, reloadUpdated) {
    if (reloadUpdated) {
      module = require.resolve(module)
      if (module in reloadingWrappers) {
        return reloadingWrappers[module]
      } else {
        watch(module, () => delete require.cache[module])

        const wrapper = typeof require(module) == 'function' ?
          function (...args) {
            if (new.target) return new (require(module))(...args)
            return require(module).apply(this, args)
          } : {}

        const wrapperProxy = new Proxy(wrapper, {get(_, prop) {
          const value = require(module)[prop]
          if (typeof value != 'function') return value

          return function (...args) {
            if (new.target) return new (require(module)[prop])(...args)
            return require(module)[prop].apply(this, args)
          }
        }})
        return reloadingWrappers[module] = wrapperProxy
      }
    }
    return require(module)
  }

  require.fresh = require.cache.untilUpdate =
    module => watchfulRequire(module, true)

  Object.assign(watchfulRequire, require)

  return watchfulRequire
}
