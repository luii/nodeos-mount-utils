var fs = require('fs')

var spawn = require('child_process').spawn

var errno = require('src-errno');
var mount = require('src-mount');


function execInit(HOME, argv)
{
  try
  {
    var homeStat = fs.statSync(HOME)
  }
  catch(error)
  {
    if(error.code != 'ENOENT') throw error

    return homeStat+' not found'
  }

  const initPath = HOME+'/init'

  try
  {
    var initStat = fs.statSync(initPath)
  }
  catch(error)
  {
    if(error.code != 'ENOENT') throw error

    return initPath+' not found'
  }

  if(!initStat.isFile())
    return initPath+' is not a file';

  if(homeStat.uid != initStat.uid || homeStat.gid != initStat.gid)
    return HOME+" uid & gid don't match with its init"

  // Update env with user variables
  var env =
  {
    HOME: HOME,
    PATH: HOME+'/bin:/usr/bin',
    __proto__: process.env
  }

  // Start user's init
  spawn(initPath, argv || [],
  {
    cwd: HOME,
    stdio: 'inherit',
    env: env,
    detached: true,
    uid: homeStat.uid,
    gid: homeStat.gid
  })
  .on('error', function(err)
  {
    console.trace(err)
  })
}

function mkdirMount(dev, path, type, flags, extras)
{
  if(typeof flags == 'string')
  {
    extras = flags
    flags = undefined
  }

  flags = flags || null
  extras = extras || ''

  try
  {
    fs.mkdirSync(path)
//    fs.mkdirSync(path, '0000')
  }
  catch(error)
  {
    if(error.code != 'EEXIST') throw error
  }

  var res = mount.mount(dev, path, type, flags, extras);
  if(res == -1) console.error('Error '+errno.getErrorString()+' while mounting',path)
  return res
}

function mountfs(envDev, path, type, extras, callback)
{
  var res, stats, error;

  try
  {
    // Running on Docker?
    stats = fs.statSync('/.dockerinit')
  }
  catch(err)
  {
    if(err.code != 'ENOENT') throw err

    error = err;

    var dev = process.env[envDev]
    if(dev)
    {
      res = mkdirMount(dev, path, type, extras);
      if(res === 0)
        delete process.env[envDev]
      else
        error = res;
    }
    else
      error = envDev+' filesystem not defined'
  }

  if(stats != undefined || res === 0)
    return callback()

  callback(error)
}

function startRepl(prompt)
{
  console.log('Starting REPL session')

  require('repl').start(prompt+'> ').on('exit', function()
  {
    console.log('Got "exit" event from repl!');
    process.exit(2);
  });
}


exports.execInit   = execInit;
exports.mkdirMount = mkdirMount;
exports.mountfs    = mountfs;
exports.startRepl  = startRepl;
