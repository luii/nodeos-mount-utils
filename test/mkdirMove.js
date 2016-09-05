'use strict'

var fs = require('fs')

var chai      = require('chai')
var Error     = require('errno-codes')
var Mount     = require('nodeos-mount')
var mkdirp    = require('mkdirp')
var sinon     = require('sinon')
var sinonChai = require('sinon-chai')

var utils   = require('../')

var should  = chai.should()
var plugins = { sinon: sinonChai }

chai.use(plugins.sinon)


describe('mkdirMove', function () {

  var UNKNOWN = Error.get(Error.UNKNOWN)
  var EEXIST  = Error.get(Error.EEXIST)

  it('should be a function', function () {
    utils.mkdirMount.should.be.a.function
  })
  it('should create the target directory', sinon.test(function () {
    var mkdirMove   = utils.mkdirMove
    var callback    = this.spy()
    var mkdirpAsync = this.stub(mkdirp, 'mkdirp')
    var mount       = this.stub(Mount, 'mount')
    var readdir     = this.stub(fs, 'readdir')
    var rmdir       = this.stub(fs, 'rmdir')

    mkdirpAsync.withArgs('/target', '0000').yields()

    mkdirMove('/source', '/target', callback)

    mkdirpAsync.should.have.been.calledOnce
    mkdirpAsync.should.have.been.calledWith('/target', '0000')
  }))
  it('should return a error if the target directory cant be created', sinon.test(function () {
    var mkdirMove   = utils.mkdirMove
    var callback    = this.spy()
    var mkdirpAsync = this.stub(mkdirp, 'mkdirp')
    var mount       = this.stub(Mount, 'mount')
    var readdir     = this.stub(fs, 'readdir')
    var rmdir       = this.stub(fs, 'rmdir')

    mkdirpAsync.withArgs('/target', '0000').yields(UNKNOWN)

    mkdirMove('/source', '/target', callback)

    mkdirpAsync.should.have.been.calledOnce
    mkdirpAsync.should.have.been.calledWith('/target', '0000')

    callback.should.have.been.calledOnce
    callback.should.have.been.calledWith(UNKNOWN)
  }))
  it('should move the files to the target directory', sinon.test(function () {
    var mkdirMove   = utils.mkdirMove
    var callback    = this.spy()
    var mkdirpAsync = this.stub(mkdirp, 'mkdirp')
    var mount       = this.stub(Mount, 'mount')
    var readdir     = this.stub(fs, 'readdir')
    var rmdir       = this.stub(fs, 'rmdir')

    mkdirpAsync.withArgs('/target', '0000').yields()
    mount.withArgs('/target', mount.MS_MOVE, {devFile: '/source'}, sinon.match.func).yields()
    readdir.withArgs('/source', sinon.match.func).yields(null, [])
    rmdir.withArgs('/source', callback).yields()

    mkdirMove('/source', '/target', callback)

    mkdirpAsync.should.have.been.calledOnce
    mkdirpAsync.should.have.been.calledWith('/target', '0000')
  }))
})
