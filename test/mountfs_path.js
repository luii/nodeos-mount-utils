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

describe('mountfs_path', function () {

  var ENOENT = Error.get(Error.ENOENT)
  var UNKNOWN = Error.get(Error.UNKNOWN)

  it('should be a function', function () {
    utils.mountfs.should.be.a.function
  })

  it('should take at least five arguments', sinon.test(function () {
    var mountfs_path = this.spy(utils, 'mountfs_path')
    var callback = this.spy()

    mountfs_path('envid', '/path', 'type', [], callback)

    mountfs_path.should.have.been.calledOnce
    mountfs_path.should.have.been.calledWith('envid', '/path', 'type', [], callback)
    mountfs_path.args[0].length.should.equal(5)
  }))
  it('should take at most 6 arguments', sinon.test(function () {
    var mountfs_path = this.spy(utils, 'mountfs_path')
    var callback = this.spy()

    mountfs_path('envid', '/path', 'type', [], '', callback)
    mountfs_path.should.have.been.calledOnce
    mountfs_path.should.have.been.calledWith('envid', '/path', 'type', [], '', callback)
    mountfs_path.args[0].length.should.equal(6)
  }))
  it('should make a statSync call for "/.dockerinit" and skip the mount', sinon.test(function () {
    var mountfs_path = utils.mountfs_path
    var callback     = this.spy()
    var statSync     = this.stub(fs, 'statSync')

    statSync.withArgs('/.dockerinit').returns({})

    mountfs_path('/devpath', '/path', 'type', [], '', callback)

    statSync.should.have.been.calledOnce
    statSync.should.have.been.calledWithExactly('/.dockerinit')
    statSync.should.have.returned(sinon.match.object)

    callback.should.have.been.calledOnce
    callback.should.have.been.calledWithExactly()
  }))
  it('should return every error except ENOENT thrown by statSync', sinon.test(function () {
    var mountfs_path = utils.mountfs_path
    var callback     = this.spy()
    var statSync     = this.stub(fs, 'statSync')

    statSync.withArgs('/.dockerinit').throws(UNKNOWN)

    mountfs_path('/devpath', '/path', 'type', [], '', callback)

    statSync.should.have.been.calledOnce
    statSync.should.have.been.calledWithExactly('/.dockerinit')
    statSync.should.have.thrown(UNKNOWN)

    callback.should.have.been.calledOnce
    callback.should.have.been.calledWithExactly(UNKNOWN)
  }))
  it('should ignore a ENOENT thrown by statSync and should mount', sinon.test(function () {
    var mountfs_path = utils.mountfs_path
    var callback     = this.spy()
    var statSync     = this.stub(fs, 'statSync')
    var mkdirpSync   = this.stub(mkdirp, 'sync')
    var mount        = this.stub(Mount, 'mount')

    statSync.withArgs('/.dockerinit').throws(ENOENT)
    mkdirpSync.withArgs('/path').returns()
    mount.withArgs('/devpath', '/path', 'type', [], '', callback).yields()

    mountfs_path('/devpath', '/path', 'type', [], '', callback)

    statSync.should.have.been.calledOnce
    statSync.should.have.been.calledWithExactly('/.dockerinit')
    statSync.should.have.thrown(ENOENT)

    callback.should.not.have.been.calledWithExactly(ENOENT)

    mkdirpSync.should.have.been.calledOnce
    mkdirpSync.should.have.been.calledWithExactly('/path', '0000')

    mount.should.have.been.calledOnce
    mount.should.have.been.calledWithExactly('/devpath', '/path', 'type', [], '', callback)

    callback.should.have.been.calledOnce
    callback.should.have.been.calledWithExactly()
  }))
  it('should return "devpath filesystem not defined" if there is no devpath', sinon.test(function () {
    var mountfs_path = utils.mountfs_path
    var callback     = this.spy()
    var statSync     = this.stub(fs, 'statSync')
    var mkdirpSync   = this.stub(mkdirp, 'sync')
    var mount        = this.stub(Mount, 'mount')

    statSync.withArgs('/.dockerinit').throws(ENOENT)
    mkdirpSync.withArgs('/path').returns()
    mount.withArgs('/devpath', '/path', 'type', [], '', callback).yields()

    mountfs_path(undefined, '/path', 'type', [], '', callback)

    statSync.should.have.been.calledOnce
    statSync.should.have.been.calledWithExactly('/.dockerinit')
    statSync.should.have.thrown(ENOENT)

    callback.should.not.have.been.calledWithExactly(ENOENT)

    mkdirpSync.should.not.have.been.calledOnce
    mkdirpSync.should.not.have.been.calledWithExactly('/path', '0000')

    mount.should.not.have.been.calledOnce
    mount.should.not.have.been.calledWithExactly('/devpath', '/path', 'type', [], '', callback)

    callback.should.have.been.calledOnce
    callback.should.have.been.calledWithExactly('undefined filesystem not defined')
  }))
})
