'use strict'

var fs      = require('fs')
var utils   = require('../')
var chai    = require('chai')
var sinon   = require('sinon')
var mkdirp  = require('mkdirp')
var Error   = require('errno-codes')
var Mount   = require('nodeos-mount')

var should  = chai.should()
var expect  = chai.expect
var plugins = { sinon: require('sinon-chai') }
    chai.use(plugins.sinon)

describe('mountfs', function () {

  var ENOENT = Error.get(Error.ENOENT)
  var UNKNOWN = Error.get(Error.UNKNOWN)

  it('should be a function', function () {
    utils.mountfs.should.be.a.function
  })
  it('should take at least five arguments', sinon.test(function () {
    var mountfs = this.spy(utils, 'mountfs')
    var callback = this.spy()

    mountfs('envid', '/path', 'type', [], callback)

    mountfs.should.have.been.calledOnce
    mountfs.should.have.been.calledWith('envid', '/path', 'type', [], callback)
    mountfs.args[0].length.should.equal(5)
  }))
  it('should take at most 6 arguments', sinon.test(function () {
    var mountfs = this.spy(utils, 'mountfs')
    var callback = this.spy()

    mountfs('envid', '/path', 'type', [], '', callback)
    mountfs.should.have.been.calledOnce
    mountfs.should.have.been.calledWith('envid', '/path', 'type', [], '', callback)
    mountfs.args[0].length.should.equal(6)
//
  }))

  it('should make a statSync call for /.dockerinit and skip the mount', sinon.test(function () {
    var mountfs = utils.mountfs
    var callback = this.spy()
    var statSync = this.stub(fs, 'statSync')

    statSync.withArgs('/.dockerinit').returns(true)

    mountfs('envdev', '/path', 'type', [], '', callback)

    statSync.should.have.been.calledOnce
    statSync.should.have.been.calledWithExactly('/.dockerinit')
    callback.should.have.been.calledOnce
    callback.should.have.been.calledWithExactly()
  }))
  it('should return every error expect ENOENT', sinon.test(function () {
    var mountfs = utils.mountfs
    var callback = this.spy()
    var statSync = this.stub(fs, 'statSync')

    statSync.withArgs('/.dockerinit').throws(UNKNOWN)

    mountfs('envdev', '/path', 'type', [], '', callback)

    statSync.should.have.been.calledOnce
    statSync.should.have.been.calledWithExactly('/.dockerinit')
    callback.should.have.been.calledOnce
    callback.should.have.been.calledWithExactly(UNKNOWN)

    statSync.should.have.been.calledBefore(callback)
  }))
  it('should swallow a ENOENT Error on statSync and keep on mounting the fs', sinon.test(function () {
    var mountfs    = utils.mountfs
    var callback   = this.spy()
    var statSync   = this.stub(fs, 'statSync')
    var mkdirpSync = this.stub(mkdirp, 'sync')
    var mount      = this.stub(Mount, 'mount')

    process.env['envdev'] = '/dev'

    statSync.withArgs('/.dockerinit').throws(ENOENT)
    mkdirpSync.withArgs('/path', '0000').returns()
    mount.withArgs('/dev', '/path', 'type', [], '', sinon.match.func).yields()

    mountfs('envdev', '/path', 'type', [], '', callback)

    statSync.should.have.been.calledOnce
    statSync.should.have.been.calledWithExactly('/.dockerinit')
    callback.should.not.have.been.calledWithExactly(ENOENT)
    mkdirpSync.should.have.been.calledOnce
    mkdirpSync.should.have.been.calledWithExactly('/path', '0000')
    mount.should.have.been.calledOnce
    mount.should.have.been.calledWith('/dev', '/path', 'type', [], '', sinon.match.func)

  }))
  it('should return every error returned by mkdirMount', sinon.test(function () {
    var mountfs    = utils.mountfs
    var callback   = this.spy()
    var statSync   = this.stub(fs, 'statSync')
    var mkdirpSync = this.stub(mkdirp, 'sync')
    var mount      = this.stub(Mount, 'mount')

    process.env['envdev'] = '/dev'

    statSync.withArgs('/.dockerinit').throws(ENOENT)
    mkdirpSync.withArgs('/path', '0000').throws(UNKNOWN)
    mount.withArgs('/dev', '/path', 'type', [], '', sinon.match.func).yields()

    mountfs('envdev', '/path', 'type', [], '', callback)

    statSync.should.have.been.calledOnce
    statSync.should.have.been.calledWithExactly('/.dockerinit')

    callback.should.not.have.been.calledWithExactly(ENOENT)
    mkdirpSync.should.have.been.calledOnce
    mkdirpSync.should.have.been.calledWithExactly('/path', '0000')
    mkdirpSync.should.have.thrown(UNKNOWN)
    mount.should.have.not.been.calledOnce
    mount.should.have.not.been.calledWith('/dev', '/path', 'type', [], '', sinon.match.func)

  }))
  it('should delete the environment variable afterwards and call the callback', sinon.test(function () {
    var mountfs    = utils.mountfs
    var callback   = this.spy()
    var statSync   = this.stub(fs, 'statSync')
    var mkdirpSync = this.stub(mkdirp, 'sync')
    var mount      = this.stub(Mount, 'mount')

    process.env['envdev'] = '/dev'
    expect(process.env['envdev']).to.equal('/dev')

    statSync.withArgs('/.dockerinit').throws(ENOENT)
    mkdirpSync.withArgs('/path', '0000').returns()
    mount.withArgs('/dev', '/path', 'type', [], '', sinon.match.func).yields()

    mountfs('envdev', '/path', 'type', [], '', callback)

    statSync.should.have.been.calledOnce
    statSync.should.have.been.calledWithExactly('/.dockerinit')

    callback.should.not.have.been.calledWithExactly(ENOENT)
    mkdirpSync.should.have.been.calledOnce
    mkdirpSync.should.have.been.calledWithExactly('/path', '0000')
    mount.should.have.been.calledOnce
    mount.should.have.been.calledWithExactly('/dev', '/path', 'type', [], '', sinon.match.func)

    expect(process.env['envdev']).to.be.undefined
  }))
  it('should return "envid" filesystem not defined', sinon.test(function () {
    var mountfs    = utils.mountfs
    var callback   = this.spy()
    var statSync   = this.stub(fs, 'statSync')
    var mkdirpSync = this.stub(mkdirp, 'sync')
    var mount      = this.stub(Mount, 'mount')

    process.env['envdev'] = '/dev'

    statSync.withArgs('/.dockerinit').throws(ENOENT)
    mkdirpSync.withArgs('/path', '0000').returns()
    mount.withArgs('/dev', '/path', 'type', [], '', sinon.match.func).yields()

    mountfs('envde', '/path', 'type', [], '', callback)

    statSync.should.have.been.calledOnce
    statSync.should.have.been.calledWithExactly('/.dockerinit')
    callback.should.not.have.been.calledWithExactly(ENOENT)
    expect(process.env['envde']).to.be.undefined
    callback.should.have.been.calledWithExactly('envde filesystem not defined')
  }))
})
