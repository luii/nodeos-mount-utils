'use strict'

var fs    = require('fs')
var utils = require('../')
var chai  = require('chai')
var sinon = require('sinon')
var Error = require('errno-codes')
var Mount = require('nodeos-mount')

var should  = chai.should()
var plugins = { sinon: require('sinon-chai') }
    chai.use(plugins.sinon)

describe('moveSync', function () {

  var ENOENT = Error.get(Error.ENOENT)
  var UNKNOWN = Error.get(Error.UNKNOWN)

  it('should be a function', function () {
    utils.move.should.be.a.function
  })
  it('should mount the source to the target synchronously', sinon.test(function () {
    var moveSync    = utils.moveSync
    var callback    = this.spy()
    var mountSync   = this.stub(Mount, 'mountSync')
    var readdirSync = this.stub(fs, 'readdirSync')
    var rmdirSync   = this.stub(fs, 'rmdirSync')

    mountSync.withArgs('/source', '/target', Mount.MS_MOVE).returns()
    readdirSync.withArgs('/source').returns({ length: 0 })
    rmdirSync.withArgs('/source').returns()

    moveSync('/source', '/target')

    mountSync.should.have.been.calledOnce
    mountSync.should.have.been.calledWith('/source', '/target', Mount.MS_MOVE)
    mountSync.should.not.have.thrown(ENOENT)
    mountSync.should.not.have.thrown(UNKNOWN)
  }))
  it('should try to mount the source and throw a error', sinon.test(function () {
    var moveSync    = utils.moveSync
    var callback    = this.spy()
    var mountSync   = this.stub(Mount, 'mountSync')
    var readdirSync = this.stub(fs, 'readdirSync')
    var rmdirSync   = this.stub(fs, 'rmdirSync')

    mountSync.withArgs('/source', '/target', Mount.MS_MOVE).throws(UNKNOWN)
    readdirSync.withArgs('/source').returns({ length: 0 })
    rmdirSync.withArgs('/source').returns()

    try {
      moveSync('/source', '/target')
    } catch (e) {
      mountSync.should.have.been.calledOnce
      mountSync.should.have.been.calledWith('/source', '/target', Mount.MS_MOVE)
      mountSync.should.have.thrown(e)
    }
  }))
  it('should readdirSync the source and check its length', sinon.test(function () {
    var moveSync    = utils.moveSync
    var callback    = this.spy()
    var mountSync   = this.stub(Mount, 'mountSync')
    var readdirSync = this.stub(fs, 'readdirSync')
    var rmdirSync   = this.stub(fs, 'rmdirSync')

    mountSync.withArgs('/source', '/target', Mount.MS_MOVE).returns()
    readdirSync.withArgs('/source').returns({ length: 0 })
    rmdirSync.withArgs('/source').returns()

    try {
      moveSync('/source', '/target')
    } catch (e) {

    }
    mountSync.should.have.been.calledOnce
    mountSync.should.have.been.calledWith('/source', '/target', Mount.MS_MOVE)

    readdirSync.should.have.been.calledOnce
    readdirSync.should.have.been.calledWith('/source')
    readdirSync.should.have.returned({ length: 0})

    rmdirSync.should.have.been.calledOnce
    rmdirSync.should.have.been.calledWith('/source')
  }))
  it('should readdirSync the source and do nothing if its not zero', sinon.test(function () {
    var moveSync = utils.moveSync
    var callback    = this.spy()
    var mountSync   = this.stub(Mount, 'mountSync')
    var readdirSync = this.stub(fs, 'readdirSync')
    var rmdirSync   = this.stub(fs, 'rmdirSync')

    mountSync.withArgs('/source', '/target', Mount.MS_MOVE).returns()
    readdirSync.withArgs('/source').returns({ length: 1 })
    rmdirSync.withArgs('/source').returns()

    try {
      moveSync('/source', '/target')
    } catch (e) {

    }
    mountSync.should.have.been.calledOnce
    mountSync.should.have.been.calledWith('/source', '/target', Mount.MS_MOVE)

    readdirSync.should.have.been.calledOnce
    readdirSync.should.have.been.calledWith('/source')
    readdirSync.should.have.returned({ length: 1 })

    rmdirSync.should.not.have.been.calledOnce
    rmdirSync.should.not.have.been.calledWith('/source')
  }))
})
