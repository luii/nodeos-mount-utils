'use strict'

var mkdirp     = require('mkdirp')
var utils      = require('../')
var Error      = require('errno-codes')
var sinon      = require('sinon')
var chai       = require('chai')
var should     = chai.should()
var plugins    = { sinon: require('sinon-chai') }
    chai.use(plugins.sinon)

describe('mkdir', function () {

  // errors
  var UNKNOWN = Error.get(Error.UNKNOWN)
  var EEXIST = Error.get(Error.EEXIST)

  it('should be a function', function () {
    utils.execInit.should.be.a.function
  })
  it('should try to create a folder with 0000 permissions', sinon.test(function () {
    var mkdirpSync = this.stub(mkdirp, 'sync')
    var callback   = this.spy()
    var mkdir      = utils.mkdir

    mkdirpSync.withArgs('/path', '0000').returns('/path')

    mkdir('/path', callback)

    mkdirpSync.should.have.been.calledOnce
    mkdirpSync.should.have.been.calledWithExactly('/path', '0000')

    callback.should.not.have.been.calledWith(UNKNOWN)
    callback.should.not.have.been.calledWith(EEXIST)

    callback.should.have.been.calledOnce
    callback.should.have.been.calledWithExactly()
  }))
  it('should throw an error if it cant create the folder', sinon.test(function () {
    var mkdirpSync = this.stub(mkdirp, 'sync')
    var callback   = this.spy()
    var mkdir      = utils.mkdir

    mkdirpSync.withArgs('/path', '0000').throws(UNKNOWN)

    mkdir('/path', callback)

    mkdirpSync.should.have.been.calledOnce
    mkdirpSync.should.have.been.calledWithExactly('/path', '0000')
    mkdirpSync.should.have.thrown(UNKNOWN)
    mkdirpSync.should.not.have.thrown(EEXIST)

    callback.should.have.been.calledOnce
    callback.should.not.have.been.calledWith(EEXIST)
    callback.should.have.been.calledWithExactly(UNKNOWN)
  }))
  it('should surpress an EEXIST error and return just the callback', sinon.test(function () {
    var mkdirpSync = this.stub(mkdirp, 'sync')
    var callback   = this.spy()
    var mkdir      = utils.mkdir

    mkdirpSync.withArgs('/path', '0000').throws(EEXIST)

    mkdir('/path', callback)

    mkdirpSync.should.have.been.calledOnce
    mkdirpSync.should.have.been.calledWithExactly('/path', '0000')
    mkdirpSync.should.not.have.thrown(UNKNOWN)
    mkdirpSync.should.have.thrown(EEXIST)

    callback.should.have.been.calledOnce
    callback.should.have.been.calledWithExactly()
  }))
})
