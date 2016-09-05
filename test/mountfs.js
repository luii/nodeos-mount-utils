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

  it('should take at least three arguments', sinon.test(function () {
    var mountfs = this.spy(utils, 'mountfs')
    var callback = this.spy()

    mountfs('/path', 'type', callback)

    mountfs.should.have.been.calledOnce
    mountfs.should.have.been.calledWith('/path', 'type', callback)
    mountfs.args[0].length.should.equal(3)
  }))
  it('should take at most 5 arguments', sinon.test(function () {
    var mountfs = this.spy(utils, 'mountfs')
    var callback = this.spy()

    mountfs('/path', 'type', [], '', callback)

    mountfs.should.have.been.calledOnce
    mountfs.should.have.been.calledWith('/path', 'type', [], '', callback)
    mountfs.args[0].length.should.equal(5)
  }))
  it('should make a stat call for "/.dockerinit" and skip the mount',
  sinon.test(function () {
    var mountfs  = utils.mountfs
    var callback = this.spy()
    var stat     = this.stub(fs, 'stat')

    stat.withArgs('/.dockerinit', sinon.match.func).yields()

    mountfs('/path', 'type', {devFile: '/devpath'}, callback)

    stat.should.have.been.calledOnce
    stat.should.have.been.calledWithExactly('/.dockerinit', sinon.match.func)

    callback.should.have.been.calledOnce
    callback.should.have.been.calledWithExactly()
  }))
  it('should return every error except ENOENT thrown by stat',
  sinon.test(function () {
    var mountfs  = utils.mountfs
    var callback = this.spy()
    var stat     = this.stub(fs, 'stat')

    stat.withArgs('/.dockerinit', sinon.match.func).yields(UNKNOWN)

    mountfs('/path', 'type', {devFile: '/devpath'}, callback)

    stat.should.have.been.calledOnce
    stat.should.have.been.calledWithExactly('/.dockerinit', sinon.match.func)

    callback.should.have.been.calledOnce
    callback.should.have.been.calledWithExactly(UNKNOWN)
  }))
  it('should ignore a ENOENT yield by stat and should mount',
  sinon.test(function () {
    var mountfs     = utils.mountfs
    var callback    = this.spy()
    var stat        = this.stub(fs, 'stat')
    var mkdirpAsync = this.stub(mkdirp, 'mkdirp')
    var mount       = this.stub(Mount, 'mount')

    stat.withArgs('/.dockerinit', sinon.match.func).yields(ENOENT)
    mkdirpAsync.withArgs('/path', '0000', sinon.match.func).yields()
    mount.withArgs('/path', 'type', null, null, callback).yields()

    mountfs('/path', 'type', callback)

    stat.should.have.been.calledOnce
    stat.should.have.been.calledWithExactly('/.dockerinit', sinon.match.func)

    mkdirpAsync.should.have.been.calledOnce
    mkdirpAsync.should.have.been.calledWithExactly('/path', '0000', sinon.match.func)

    mount.should.have.been.calledOnce
    mount.should.have.been.calledWithExactly('/path', 'type', null, null, callback)

    callback.should.have.been.calledOnce
    callback.should.have.been.calledWithExactly()

    callback.should.not.have.been.calledWithExactly(ENOENT)
  }))
})
