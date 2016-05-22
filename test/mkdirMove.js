'use strict'

var utils   = require('../')
var fs      = require('fs')
var Mount   = require('nodeos-mount')
var Error   = require('errno-codes')
var mkdirp  = require('mkdirp')
var sinon   = require('sinon')
var chai    = require('chai')
var should  = chai.should()
var plugins = { sinon: require('sinon-chai') }
    chai.use(plugins.sinon)

describe('mkdirMove', function () {

  var UNKNOWN = Error.get(Error.UNKNOWN)
  var EEXIST  = Error.get(Error.EEXIST)

  it('should be a function', function () {
    utils.mkdirMount.should.be.a.function
  })
  it('should create the target directory', sinon.test(function () {
    var mkdirMove  = utils.mkdirMove
    var callback   = this.spy()
    var mkdirpSync = this.stub(mkdirp, 'sync')
    var mount      = this.stub(Mount, 'mount')
    var readdir    = this.stub(fs, 'readdir')
    var rmdir      = this.stub(fs, 'rmdir')

    mkdirpSync.withArgs('/target', '0000').returns('/target')

    mkdirMove('/source', '/target', callback)

    mkdirpSync.should.have.been.calledOnce
    mkdirpSync.should.have.been.calledWith('/target', '0000')
  }))
  it('should return a error if the target directory cant be created', sinon.test(function () {
    var mkdirMove  = utils.mkdirMove
    var callback   = this.spy()
    var mkdirpSync = this.stub(mkdirp, 'sync')
    var mount      = this.stub(Mount, 'mount')
    var readdir    = this.stub(fs, 'readdir')
    var rmdir      = this.stub(fs, 'rmdir')

    mkdirpSync.withArgs('/target', '0000').throws(UNKNOWN)

    mkdirMove('/source', '/target', callback)

    mkdirpSync.should.have.been.calledOnce
    mkdirpSync.should.have.been.calledWith('/target', '0000')
    mkdirpSync.should.have.thrown(UNKNOWN)

    callback.should.have.been.calledOnce
    callback.should.have.been.calledWith(UNKNOWN)
  }))
  it('should move the files to the target directory', sinon.test(function () {
    var mkdirMove  = utils.mkdirMove
    var callback   = this.spy()
    var mkdirpSync = this.stub(mkdirp, 'sync')
    var mount      = this.stub(Mount, 'mount')
    var readdir    = this.stub(fs, 'readdir')
    var rmdir      = this.stub(fs, 'rmdir')

    mkdirpSync.withArgs('/target', '0000').returns('/target')
    mount.withArgs('/source', '/target', mount.MS_MOVE, sinon.match.func).yields()
    readdir.withArgs('/source', sinon.match.func).yields(null, [])
    rmdir.withArgs('/source', callback).yields()

    mkdirMove('/source', '/target', callback)

    mkdirpSync.should.have.been.calledOnce
    mkdirpSync.should.have.been.calledWith('/target', '0000')
  }))
})
