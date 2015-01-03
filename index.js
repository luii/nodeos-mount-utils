var fs = require('fs')

var spawn = require('child_process').spawn

var mount = require('nodeos-mount');


function execInit(HOME, argv)
{
  try
  {
    var homeStat = fs.statSync(HOME)
  }
  catch(error)
  {
    if(error.code != 'ENOENT') throw error

    return HOME+' not found'
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
  .on('error', console.trace.bind(console))
  .unref()
}

function mkdirMount(dev, path, type, flags, extras, callback)
{
  try
  {
    fs.mkdirSync(path, '0111')
  }
  catch(error)
  {
    if(error.code != 'EEXIST') throw error
  }

  mount.mount(dev, path, type, flags, extras, callback);
}

function mountfs(envDev, path, type, flags, extras, callback)
{
  try
  {
    // Running on Docker?
    fs.statSync('/.dockerinit')
  }
  catch(err)
  {
    if(err.code != 'ENOENT') throw err

    var dev = process.env[envDev]
    if(dev)
      return mkdirMount(dev, path, type, flags, extras, function(error)
      {
        if(error) return callback(error)

        delete process.env[envDev]
        callback()
      });

    return callback(envDev+' filesystem not defined')
  }

  return callback()
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


exports.flags = mount;

exports.execInit   = execInit;
exports.mkdirMount = mkdirMount;
exports.mountfs    = mountfs;
exports.startRepl  = startRepl;
