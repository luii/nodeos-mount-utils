'use strict'

var fs   = require('fs')
var repl = require('repl')

var mkdirp = require('mkdirp')
var mount  = require('nodeos-mount')


/**
 * @module nodeos-mount-utils
 */

/**
 * Create a directory without permissions to read, write nor execute
 *
 * @param {String}   path     Path where directory will be created
 * @param {Function} callback Callback
 */
function mkdir(path, callback)
{
  mkdirp.mkdirp(path, '0000', function(error)
  {
    // catch everything, but not Entry Exists
    if(error && error.code !== 'EEXIST') return callback(error)

    return callback()
  })
}

/**
 * Asynchronous function for creating a
 * directory and then mount the `dev` file to it
 *
 * @example
 *   mkdirMount('path/to/my/dir', 'type', {devFile: 'path/to/my/dev'},
                function(err){})
 * @see For more Information please visit
 * {@link https://github.com/NodeOS/nodeos-mount#mountmountsource-target-fstype-options-datastr-callback|this}
 * site
 *
 * @param {String}        path         Directory to mount the device to.
 * @param {String}        type         Filesystem identificator (one of /proc/filesystems).
 * @param {Array|Number}  [flags]      See below.
 * @param {String|Object} [extras]     The data argument is interpreted by the
 *                                     different file systems.
 *                                     Typically it is a string of comma-separated
 *                                     options understood by this file system.
 * @param {String}        [extras.dev] Device-File being mounted (located in /dev) a.k.a. devFile.
 * @param {Function}      callback     Function called after the mount operation finishes.
 *                                     Receives only one argument err.
 */
function mkdirMount(path, type, flags, extras, callback)
{
  if(flags && (flags.constructor.name === 'Object' || flags instanceof Function))
  {
    callback = extras
    extras   = flags
    flags    = null
  }

  if(extras instanceof Function)
  {
    callback = extras
    extras   = null
  }


  mkdir(path, function(error)
  {
    if(error) return callback(error)

    mount.mount(path, type, flags, extras, callback)
  })
}

/**
 * Mounts a filesystem through a path
 *
 * @example
 *   mountfs('path/to/mount/to', 'type', {devFile: 'path/to/dev'},
 *           function(err){})
 * @see For more Information please visit
 * {@link https://github.com/NodeOS/nodeos-mount#mountmountsource-target-fstype-options-datastr-callback|this}
 * site
 *
 * @param {String}        path     Directory to mount the device to.
 * @param {String}        type     Filesystem identificator (one of /proc/filesystems).
 * @param {Array|Number}  [flags]  See below.
 * @param {Object|String} [extras] The data argument is interpreted by the
 *                                 different file systems.
 *                                 Typically it is a string of comma-separated
 *                                 options understood by this file system.
 * @param {Function}      callback Function called after the mount operation finishes.
 *                                 Receives only one argument err.
 */
function mountfs(path, type, flags, extras, callback)
{
  if(flags && (flags.constructor.name === 'Object' || flags instanceof Function))
  {
    callback = extras
    extras   = flags
    flags    = null
  }

  if(extras instanceof Function)
  {
    callback = extras
    extras   = null
  }


  fs.stat('/.dockerinit', function(error)
  {
    // Running on Docker?
    if(!error) return callback()

    // catch everything, but not "Error no Entry"
    if(error.code !== 'ENOENT') return callback(error)

    // mount the filesystem
    mkdirMount(path, type, flags, extras, callback)
  })
}

/**
 * Asynchronously move a subtree.
 *
 * The source specifies an existing mount point and target specifies the new
 * location. The move is atomic: at no point is the subtree unmounted. The
 * filesystemtype, mountflags, and data arguments are ignored.
 *
 * @example
 *   move('source/path', 'target/path', function(err) {})
 * @see For more Information please visit
 * {@link https://github.com/NodeOS/nodeos-mount#mountmountsource-target-fstype-options-datastr-callback|this}
 * site
 *
 * @param {String}   source   The source subtree to move
 * @param {String}   target   The path to move the subtree into
 * @param {Function} callback Function called after the mount operation finishes.
 *                            Receives only one argument err.
 */
function move(source, target, callback)
{
  mount.mount(target, mount.MS_MOVE, {devFile: source}, function(error)
  {
    if(error) return callback(error)

    fs.readdir(source, function(err, files)
    {
      if(err) return callback(err)

      if(files.length) return callback()

      fs.rmdir(source, callback)
    })
  })
}

/**
 * Synchronously move a subtree
 *
 * The source specifies an existing mount point and target specifies the new
 * location. The move is atomic: at no point is the subtree unmounted. The
 * filesystemtype, mountflags, and data arguments are ignored.
 *
 * @example
 *   moveSync('source/path', 'target/path')
 * @see For more Information please visit
 * {@link https://github.com/NodeOS/nodeos-mount#mountmountsource-target-fstype-options-datastr-callback|this}
 * site
 *
 * @param {String} source The source subtree to move
 * @param {String} target The path to move the subtree into
 */
function moveSync(source, target)
{
  mount.mountSync(target, mount.MS_MOVE, {devFile: source})

  // if no more file is in the source path
  if(!fs.readdirSync(source).length)
    fs.rmdirSync(source)  // then delete the source
}

/**
 * Asynchronously create a target directory mount the source with MS_MOVE to it
 * and move all files to the newly created directory
 *
 * @example
 *   mkdirMove('source/path', 'target/path', function(err) {})
 *
 * @param {String}   source   The source subtree to move
 * @param {String}   target   The path to move the subtree into
 * @param {Function} callback Function called after the mount operation finishes.
 *                            Receives only one argument err.
 */
function mkdirMove(source, target, callback)
{
  // create target directory
  mkdir(target, function(error)
  {
    if(error) return callback(error)

    // move all the files to the target
    move(source, target, callback)
  })
}

/**
 * Starts a repl in case if somethings not working
 *
 * @param {String} promp The name of the prompt
 *
 * @event repl#exit
 */
function startRepl(prompt)
{
  console.log('Starting REPL session')

  repl.start(`${prompt}> `).on('exit', function()
  {
    console.log('Got "exit" event from repl!')
    process.exit(2)
  })
}


exports.flags      = mount
exports.mkdir      = mkdir
exports.mkdirMount = mkdirMount
exports.mountfs    = mountfs
exports.move       = move
exports.moveSync   = moveSync
exports.mkdirMove  = mkdirMove
exports.startRepl  = startRepl
