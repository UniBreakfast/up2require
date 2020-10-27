let done = false

module.exports = function upgradeToUpdate(require) {
  if (done) return

  const originalRequire = require
  const reloadingWrappers = {}

  require = function require(module, watchToReload) {
    if (watchToReload) {
      if (module in reloadingWrappers) {
        return reloadingWrappers[module]
      } else {
        originalRequire("fs").watch(
          originalRequire("path").resolve(module),
          () => delete require.cache[require.resolve(module)]
        )

        reloadingWrappers[module] = function (...args) {
          return originalRequire(module).apply(this, args)
        }

        return Object.assign(reloadingWrappers[module], originalRequire(module))
      }
    }

    return originalRequire(module)
  }

  Object.assign(require, originalRequire, {fresh(module) {
    return require(module, true)
  }})

  done = true

  return require
}
