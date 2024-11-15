# [up2require](https://github.com/UniBreakfast/up2require)

## up2require stands for "upgrade-to-update" for the require() function

up2require provides an option for some of your commonJS modules (you choose which ones) to auto-reload if you are developing locally and just made some changes to the module file. No need to restart the server to see changes; however, you'll still need to restart for changes to other modules or the entrypoint file to take effect.

My primary use case for up2require is autoreloading listener/handler functions in separate modules, but it can be applied to various other scenarios.

up2require provides an `upgradeToUpdate(require)` function that enhances the normal `require(module)` function with three new ways to load modules, ensuring they're always up-to-date. If used in the usual way, `require(module)` will behave as it normally does.

To keep the module fresh, up2require returns a wrapper around the loaded module instead of the module itself. The wrapper will either call the original `require(module)` function when invoked or act as a proxy when accessing properties or methods on the returned object. Additionally, up2require uses OS-level functionality to monitor the module file and clears the `require.cache` when changes are detected. Subsequent accesses will reflect the updated file content.

## Installation

As usual, just
```
npm i up2require
```

## Usage instructions

There are three ways to use the fruits of the `upgradeToUpdate(require)` call (more declarative examples are below):

### First way

`path` here means the same relative path that goes for the normal `require(modulePath)`

```js
const upgradeToUpdate = require('up2require')
const watchfulRequire = upgradeToUpdate(require)
const reloadUpdate = true

const moduleFn = watchfulRequire('./path/moduleFn.js', reloadUpdated)
...
eventEmitterInstance.on('eventName', moduleFn)
```

I prefer to just replace the normal `require` with the upgraded one, because without the second argument it works exactly as the normal `require` does, so the same way but less declarative, and the more realistic example for me is

```js
const dev = !process.env.PORT
const port = dev ? 3000 : process.env.PORT

if (dev) require = require('up2require')(require)

const handleRequest = require('./requestHandler.js', dev)

require('http').createServer(handleRequest).listen(port)
```

Existing `process.env.PORT` here is telling me that the app is currently running on Heroku and so the autorefresh is pointless, and otherwise it is clearly in dev-mode.

### Second way

Notice that we don't save the upgraded `require` as it's available to us as a `.fresh(module)` method on the normal one after upgrading. Called in this way, it doesn't need or take the second argument, as `fresh` already means that we want it to reload when the module file is changed.

```js
require('up2require')(require)
const moduleFn = require.fresh('./path/moduleFn.js')

setInterval(moduleFn, 1000)
```

and if you need to base it on devMode again

```js
if (devMode) require('up2require')(require)

const fn = devMode? require.fresh('./fn.js') : require('./fn.js')
...
```

I hope you have noticed that **when going the first two ways, you need to `require('up2require')` and call it for the upgrading procedure in every file where you're going to need it.** The reason for that being the way the normal `require(module)` function is provided for us in Node.js - in every single file/module, it's another `require` function made just to be used in it, and it is preloaded with the relative path. So, yeah, we can upgrade it once and use everywhere..., but that means it will look for the modules by the absolute path (or to be exact, it will look by the path relative to the file you are upgraded it in, and I hope you are reasonable enough to do it in the entrypoint file). Hence the

### Third way

So here we import **up2require** and upgrade the `require` with it only once - in the `index.js` at root level in my case. And again, no need to save the upgraded one. The `require` function itself stays normal, but the `.cache` object on it will have the `.untilUpdate(module)` method - that's again another alias for `watchfulRequire(module)`

```js
require('up2require')(require)

// the next line can be in any file in the project and the path will still be relative to the index.js location
const moduleObj = require.cache.untilUpdate('./path_from_root/module.js')
const staticModuleObj = require('./normal_relative_path/module.js')
...
console.log(moduleObj.prop)
moduleObj.method() // theese would be refreshing
...
console.log(staticModuleObj.prop)
staticModuleObj.method() // theese won't be refreshing
```

Of course you can mix and match all three ways as you see fit.

That's all. **Use it wisely**. Feedback would be much appreciated!
