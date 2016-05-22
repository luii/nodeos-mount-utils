'use strict'

var utils   = require('../')
var Mount   = require('nodeos-mount')
var Error   = require('errno-codes')
var mkdirp  = require('mkdirp')
var sinon   = require('sinon')
var chai    = require('chai')
var should  = chai.should()
var plugins = { sinon: require('sinon-chai') }
    chai.use(plugins.sinon)

describe('mkdirMount', function () {

  var UNKNOWN = Error.get(Error.UNKNOWN)
  var EEXIST  = Error.get(Error.EEXIST)

  it('should be a function', function () { utils.mkdirMount.should.be.a.function })
  it('should return a UNKNOWN error returned by mkdir', sinon.test(function () {
    var mount      = this.stub(Mount, 'mount')
    var mkdirpSync  = this.stub(mkdirp, 'sync')
    var callback   = this.spy()
    var mkdirMount = utils.mkdirMount

    mount.withArgs('/dev', '/path', 'type', [], '', callback).yields()
    mkdirpSync.withArgs('/path', '0000').throws(UNKNOWN)

    mkdirMount('/dev', '/path', 'type', [], '', callback)

    mkdirpSync.should.have.been.calledWith('/path', '0000')
    mkdirpSync.should.have.thrown(UNKNOWN)

    callback.should.have.been.calledOnce
    callback.should.have.been.calledWith(UNKNOWN)

    mount.should.not.have.been.calledOnce
    mount.should.not.have.been.calledWith('/dev', '/path', 'type', [], '', callback)
  }))
  it('should (irgnore or not return) a EEXIST returned by mkdir', sinon.test(function () {
    var mount      = this.stub(Mount, 'mount')
    var mkdirpSync  = this.stub(mkdirp, 'sync')
    var callback   = this.spy()
    var mkdirMount = utils.mkdirMount

    mount.withArgs('/dev', '/path', 'type', [], '', callback).yields()
    mkdirpSync.withArgs('/path', '0000').throws(EEXIST)

    mkdirMount('/dev', '/path', 'type', [], '', callback)

    mkdirpSync.should.have.been.calledWith('/path', '0000')
    mkdirpSync.should.have.thrown(EEXIST)

    callback.should.have.been.calledOnce
    callback.should.not.have.been.calledWith(EEXIST)
    callback.should.have.been.calledWith()

    mount.should.have.been.calledOnce
    mount.should.have.been.calledWith('/dev', '/path', 'type', [], '', callback)
  }))
  it('should mount the created directory to a dev file', sinon.test(function () {
    var mount      = this.stub(Mount, 'mount')
    var mkdirpSync = this.stub(mkdirp, 'sync')
    var callback   = this.spy()
    var mkdirMount = utils.mkdirMount

    mount.withArgs('/dev', '/path', 'type', [], '', callback).yields()
    mkdirpSync.withArgs('/path', '0000').returns('/path')

    mkdirMount('/dev', '/path', 'type', [], '', callback)

    callback.should.have.been.not.calledWith(UNKNOWN)
    callback.should.have.been.not.calledWith(EEXIST)
    mount.should.have.been.calledOnce
    mount.should.have.been.calledWith('/dev', '/path', 'type', [], '', callback)

    callback.should.have.been.calledOnce
    callback.should.have.been.calledWith()
    callback.should.have.been.calledAfter(mount)
  }))
})
