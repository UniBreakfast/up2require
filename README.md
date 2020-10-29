# up2require means "upgrade-to-update" for require()

And that means that you get an option for some of your commonJS modules (you choose which ones) to auto-reload if you are developing locally and just made some changes to the module file. So no need to restart the whole server to see the changes every time (you still need to restart it to see the changes you made to the rest of your modules or to the entrypoint-file to take effect of course).

The main usage of **up2require** for me is autoreloading of the multiple listener/handler functions I put into separate modules, but it can be any number of other use cases really.

So what it actually does is it provides a function `upgradeToUpdate(require)` which does exactly that, it upgrades the normal `require(module)` function you passed into it with three new ways to call it to get the required module to always be *fresh* (in sync with the last changes to its file). And if called the usual way like `require(module)` it will act just as the normal one does.

To keep the module always fresh it'll return to you not the loaded module itself but the wrapper around it. That wrapper will do normal `require(module)` inside itself when called as a function or it will act as a proxy if you will try to access some properties or methods on the object returned by your module. And the second thing it'll do is it will watch the module file with some pretty fast OS-magic and when that file changes it will clear the `require.cache` for it. So being accessed again it will work according to the current file content.

# Installation

As usual just

```
npm i up2require
```

## Usage instructions

There are three ways to use the fruits of the `upgradeToUpdate(require)` call
(more declarative examples are below):

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

I prefer to just replace the normal `require` with the upgraded one,
because without the second argument it works exactly as the normal `require` does,
so the same way but less declarative, and the more realistic example for me is

```js
const dev = !process.env.PORT
const port = dev ? 3000 : process.env.PORT

if (dev) require = require('up2require')(require)

const handleRequest = require('./requestHandler.js', dev)

require('http').createServer(handleRequest).listen(port)
```

Existing `process.env.PORT` here is telling me that app is currently running on heroku and so the autorefresh is pointless, and otherwise it is clearly in dev-mode.

### Second way
Notice that we don't save the upgraded `require` as it available to us
as a `.fresh(module)` method on the normal one after upgrading.
Called in this way it doesn't need or take the second agrument, as `fresh` already means
that we want it to reload when module-file is changed.

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

I hope you have noticed that **when going the first two ways you need to `require('up2require')` and call it for the upgrading procedure in every file where you're going to need it.** The reason for that being the way the normal `require(module)` function is provided for us in nodeJS - in every single file/module it's another `require` function made just to be used in it, and it is preloaded with the relative path. So, yeah, we can upgrade it once and use everywhere..., but that means it will look for the modules by the absolute path (or to be exact it will look by the path relative to the file you are upgraded it in, and I hope you are reasonable enough to do it in the entrypoint file). Hence the

### Third way
So here we import **up2require** and upgrade the `require` with it only once - in the `index.js` at root level in my case. And again no need to save the upgraded one. The `require` function itself stays normal, but the `.cache` object on it will have the `.untilUpdate(module)` method - that's again another alias for `watchfulRequire(module)`

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
