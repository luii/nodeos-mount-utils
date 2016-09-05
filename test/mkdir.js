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
    var mkdirpAsync = this.stub(mkdirp, 'mkdirp')
    var callback    = this.spy()
    var mkdir       = utils.mkdir

    mkdirpAsync.withArgs('/path', '0000', sinon.match.func).yields()

    mkdir('/path', callback)

    mkdirpAsync.should.have.been.calledOnce
    mkdirpAsync.should.have.been.calledWithExactly('/path', '0000', sinon.match.func)

    callback.should.not.have.been.calledWith(UNKNOWN)
    callback.should.not.have.been.calledWith(EEXIST)

    callback.should.have.been.calledOnce
    callback.should.have.been.calledWithExactly()
  }))
  it("should throw an error if it can't create the folder", sinon.test(function () {
    var mkdirpAsync = this.stub(mkdirp, 'mkdirp')
    var callback    = this.spy()
    var mkdir       = utils.mkdir

    mkdirpAsync.withArgs('/path', '0000').yields(UNKNOWN)

    mkdir('/path', callback)

    mkdirpAsync.should.have.been.calledOnce
    mkdirpAsync.should.have.been.calledWithExactly('/path', '0000', sinon.match.func)

    callback.should.have.been.calledOnce
    callback.should.not.have.been.calledWith(EEXIST)
    callback.should.have.been.calledWithExactly(UNKNOWN)
  }))
  it('should surpress an EEXIST error and return just the callback', sinon.test(function () {
    var mkdirpAsync = this.stub(mkdirp, 'mkdirp')
    var callback    = this.spy()
    var mkdir       = utils.mkdir

    mkdirpAsync.withArgs('/path', '0000').yields(EEXIST)

    mkdir('/path', callback)

    mkdirpAsync.should.have.been.calledOnce
    mkdirpAsync.should.have.been.calledWithExactly('/path', '0000', sinon.match.func)

    callback.should.have.been.calledOnce
    callback.should.have.been.calledWithExactly()
  }))
})
