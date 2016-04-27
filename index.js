'use strict'

var fs    = require('fs')
var spawn = require('child_process').spawn

var mkdirp = require('mkdirp').sync
var mount  = require('nodeos-mount')


/**
 * @module nodeos-mount-utils
 */

/**
 * Create a directory without permissions to read, write nor execute
 * 
 * @param {String}   path     Path where directory will be created
 * @param {Function} callback Callback
 * 
 * @return {Function} Invokes and returns the callback.
 *                    The callback can be invoked with a error
 */
function mkdir(path, callback)
{
  try
  {
    mkdirp(path, '0000')
  }
  catch(error)
  {
    // catch everything, but not Entry Exists
    if(error.code != 'EEXIST') return callback(error)
  }

  return callback()
}

/**
 * Execute the init file
 * 
 * @param {String} HOME Path of the home folder where the init file is located
 * @param {Array}  argv Array of arguments
 * 
 * @return {Function} Return the callback if no error happened or with
 *                    an error argument if an error happened
 */
function execInit(HOME, argv, callback)
{
  try
  {
    // get a stat of the home folder
    var homeStat = fs.statSync(HOME)
  }
  catch(error)
  {
    // Return every error but no ENOENT
    if(error.code != 'ENOENT') return callback(error)

    return callback(`${HOME} not found`)
  }

  // path to the init file
  const initPath = `${HOME}/init`

  try
  {
    var initStat = fs.statSync(initPath)
  }
  catch(error)
  {
    if(error.code != 'ENOENT') return callback(error)

    return callback(`${initPath} not found`)
  }

  // check if the init file is an actual file
  if(!initStat.isFile())
    return callback(`${initPath} is not a file`);

  if(homeStat.uid != initStat.uid || homeStat.gid != initStat.gid)
    return callback(`${HOME} uid & gid don't match with its init`)

  // Start user's init
  spawn(`${__dirname}/bin/chrootInit`, [homeStat.uid, homeStat.gid].concat(argv),
  {
    cwd: HOME,
    stdio: 'inherit'
  })
  .on('exit', callback)
}

/**
 * Asynchronous function for creating a
 * directory and then mount the `dev` file to it
 * 
 * @example
 *   mkdirMount('path/to/my/dev', 'path/to/my/dir', 'type', function(err) {})
 * @see For more Information please visit {@link https://github.com/NodeOS/nodeos-mount#mountmountsource-target-fstype-options-datastr-callback|this} site
 * 
 * @param {String}       dev      Device-File being mounted (located in /dev) a.k.a. devFile.
 * @param {String}       path     Directory to mount the device to.
 * @param {String}       type     Filesystem identificator (one of /proc/filesystems).
 * @param {Array|Number} [flags]  See below.
 * @param {String}       [extras] The data argument is interpreted by the
 *                                different file systems.
 *                                Typically it is a string of comma-separated
 *                                options understood by this file system.
 * @param {Function}     callback Function called after the mount operation finishes.
 *                                Receives only one argument err.
 */
function mkdirMount(dev, path, type, flags, extras, callback)
{
  mkdir(path, function(error)
  {
    if(error) return callback(error)

    mount.mount(dev, path, type, flags, extras, callback);
  })
}

/**
 * Mounts a filesystem through a environment variable
 * 
 * @example
 *   mountfs('envid', 'path/to/mount/to', 'type', function(err) {})
 * @see    For more Information please visit {@link https://github.com/NodeOS/nodeos-mount#mountmountsource-target-fstype-options-datastr-callback|this} site
 * @todo   this needs to be deprecated
 * 
 * @param {String}       path     Directory to mount the device to.
 * @param {String}       type     Filesystem identificator (one of /proc/filesystems).
 * @param {Array|Number} [flags]  See below.
 * @param {String}       [extras] The data argument is interpreted by the
 *                                different file systems.
 *                                Typically it is a string of comma-separated
 *                                options understood by this file system.
 * @param {Function}     callback Function called after the mount operation finishes.
 *                                Receives only one argument err.

 * @return {Function} Returns the callback
 */
function mountfs(envDev, path, type, flags, extras, callback)
{
  if(extras instanceof Function)
  {
    callback = extras
    extras   = undefined
  }

  try
  {
    // Running on Docker?
    fs.statSync('/.dockerinit')
  }
  catch(error)
  {
    // catch everything, but not "Error no Entry"
    if(err.code != 'ENOENT') return callback(error)

    // get environment variable
    var dev = process.env[envDev]
    if(dev)
    {
      // create the path and mount the dev file to it
      return mkdirMount(dev, path, type, flags, extras, function(error)
      {
        if(error) return callback(error)

        delete process.env[envDev]
        callback()
      });
    }
    return callback(`${envDev} filesystem not defined`)
  }

  return callback()
}

/**
 * Mounts a filesystem through a path
 * 
 * @example
 *   mountfs_path('path/to/dev', 'path/to/mount/to', 'type', function(err) {})
 * @see    For more Information please visit {@link https://github.com/NodeOS/nodeos-mount#mountmountsource-target-fstype-options-datastr-callback|this} site
 * 
 * @param {String}       path     Directory to mount the device to.
 * @param {String}       type     Filesystem identificator (one of /proc/filesystems).
 * @param {Array|Number} [flags]  See below.
 * @param {String}       [extras] The data argument is interpreted by the
 *                                different file systems.
 *                                Typically it is a string of comma-separated
 *                                options understood by this file system.
 * @param {Function}     callback Function called after the mount operation finishes.
 *                                Receives only one argument err.
 * 
 * @return {Function} Returns the callback
 */
function mountfs_path(devPath, path, type, flags, extras, callback)
{
  if(extras instanceof Function)
  {
    callback = extras
    extras   = undefined
  }

  try
  {
    // Running on Docker?
    fs.statSync('/.dockerinit')
  }
  catch(error)
  {
    // catch everything, but not "Error no Entry"
    if(err.code != 'ENOENT') return callback(error)

    // mount the filesystem
    if(devPath)
      return mkdirMount(devPath, path, type, flags, extras, callback);

    return callback(`${devPath} filesystem not defined`)
  }

  return callback()
}

/**
 * Asynchronously move a subtree.
 * 
 * The source specifies an existing mount point and target specifies the new location.
 * The move is atomic: at no point is the subtree unmounted.
 * The filesystemtype, mountflags, and data arguments are ignored.
 * 
 * @example
 *   move('source/path', 'target/path', function(err) {})
 * @see   For more Information please visit {@link https://github.com/NodeOS/nodeos-mount#mountmountsource-target-fstype-options-datastr-callback|this} site
 * 
 * @param {String}   source   The source subtree to move
 * @param {String}   target   The path to move the subtree into
 * @param {Function} callback Function called after the mount operation finishes.
 *                            Receives only one argument err.
 * 
 * @return {Function} Returns the callback
 */
function move(source, target, callback)
{
  mount.mount(source, target, mount.MS_MOVE, function(error)
  {
    if(error) return callback(error)

    fs.readdir(source, function(error, files)
    {
      if(error) return callback(error)

      if(files.length) return callback()
      fs.rmdir(source, callback)
    })
  });
}

/**
 * Synchronously move a subtree
 * 
 * The source specifies an existing mount point and target specifies the new location.
 * The move is atomic: at no point is the subtree unmounted.
 * The filesystemtype, mountflags, and data arguments are ignored.
 * 
 * @example
 *   moveSync('source/path', 'target/path')
 * @see   For more Information please visit {@link https://github.com/NodeOS/nodeos-mount#mountmountsource-target-fstype-options-datastr-callback|this} site
 * 
 * @param {String} source The source subtree to move
 * @param {String} target The path to move the subtree into
 */
function moveSync(source, target)
{
  mount.mountSync(source, target, mount.MS_MOVE);

  // if no more file is in the source path
  if(!fs.readdirSync(source).length)
    fs.rmdirSync(source) // then delete the source
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
 * 
 * @return {Function} Returns the callback
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

  require('repl').start(prompt+'> ').on('exit', function()
  {
    console.log('Got "exit" event from repl!');
    process.exit(2);
  });
}


exports.flags = mount;

exports.execInit     = execInit;
exports.mkdirMount   = mkdirMount;
exports.mountfs      = mountfs;
exports.mountfs_path = mountfs_path;
exports.move         = move;
exports.moveSync     = moveSync;
exports.mkdirMove    = mkdirMove;
exports.startRepl    = startRepl;
