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

        const wrapperFn = function (...args) {
          if (new.target) return new (require(module))(...args)
          return require(module).apply(this, args)
        }

        const wrapperProxy = new Proxy(wrapperFn, {get(_, prop) {
          return require(module)[prop]
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
