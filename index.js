'use strict'

const fs     = require('fs-extra')
const repl   = require('repl')
const mkdirp = require('mkdirp')
const mount  = require('nodeos-mount')


/**
 * @module nodeos-mount-utils
 */

/**
 * Create a directory without permissions to read, write nor execute
 *
 * @example
 *  async function makeDir() {
 *    let success = await mkdir('mypath/')
 *  }
 * @param  {String}                 path     Path where directory will be created
 * @return {Promise<Error|Boolean>}          Returns a rejected promise if the
 *                                           mkdir function failed or true if
 *                                           it succeeds
 */
function mkdir(path) {
  return new Promise((resolve, reject) => {
    mkdirp.mkdirp(path, '0000', function(error) {
      // catch everything, but not Entry Exists
      if(error && error.code !== 'EEXIST') return reject(error)
  
      return resolve(true)
    })
  })
}

/**
 * Asynchronously create a directory and then mount the filesystem on it
 *
 * @example
 *   mkdirMount('path/to/my/dir', 'type', {devFile: 'path/to/my/dev'},
                function(err){})
 * @see For more Information please visit
 * {@link https://github.com/NodeOS/nodeos-mount#mountmountsource-target-fstype-options-datastr-callback|this}
 * site
 *
 * @param  {String}        path         Directory to mount the device to.
 * @param  {String}        type         Filesystem identificator (one of /proc/filesystems).
 * @param  {Array|Number}  [flags]      See below.
 * @param  {String|Object} [extras]     The data argument is interpreted by the
 *                                      different file systems.
 *                                      Typically it is a string of comma-separated
 *                                      options understood by this file system.
 * @param  {String}        [extras.dev] Device-File being mounted (located in /dev) a.k.a. devFile.
 * @return {Promise}                    Returns either a resolved or rejected promise
 */
async function mkdirMount(path, type, flags, extras) {
  try {
    await mkdir(path)
    await mount.mount(path, type, flags, extras)
  } catch (error) {
    return error
  }
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
 * @param  {String}        path     Directory to mount the device to.
 * @param  {String}        type     Filesystem identificator (one of /proc/filesystems).
 * @param  {Array|Number}  [flags]  See below.
 * @param  {Object|String} [extras] The data argument is interpreted by the
 *                                 different file systems.
 *                                 Typically it is a string of comma-separated
 *                                 options understood by this file system.
 * @return {Promise}               Returns either a resolved or rejected promise
 */
async function mountfs(path, type, flags, extras) {
  try {
    let stat = await fs.stat('/.dockerinit')
    return await mkdirMount(path, type, flags, extras)
  } catch (error) {
    if (error.code !== 'ENOENT') return error
  }
}

/**
 * Asynchronously move a subtree.
 *
 * The source specifies an existing mount point and target specifies the new
 * location. The move is atomic: at no point is the subtree unmounted. The
 * filesystemtype, mountflags, and data arguments are ignored.
 *
 * @example
 *   move('source/path', 'target/path')
 * @see For more Information please visit
 * {@link https://github.com/NodeOS/nodeos-mount#mountmountsource-target-fstype-options-datastr-callback|this site}
 * 
 * @param {String}   source   The source subtree to move
 * @param {String}   target   The path to move the subtree into
 */
async function move(source, target) {
  try {
    await mount.mount(trarget, mount.MS_MOVE, { devFile: source })
    let files = await fs.readdir(source)

    if (files.length) return Promise.resolve()
    return await fs.rmdir(source)
  } catch (error) {
    return error
  }
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
 * {@link https://github.com/NodeOS/nodeos-mount#mountmountsource-target-fstype-options-datastr-callback|this site}
 * 
 *
 * @param {String} source The source subtree to move
 * @param {String} target The path to move the subtree into
 */
function moveSync(source, target) {
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
async function mkdirMove(source, target) {
  try {
    await mkdir(target)
    await move(source, target)
  } catch (error) {
    return error
  }
}

/**
 * Starts a repl in case if somethings not working
 *
 * @param {String} promp The name of the prompt
 *
 * @event repl#exit
 */
function startRepl(prompt) {
  console.log('Starting REPL session')

  repl.start(`${prompt}> `)
      .on('exit', () => {
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
