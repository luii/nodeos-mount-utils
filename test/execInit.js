'use strict'

var fs   = require('fs')
var proc = require('child_process')

var chai       = require('chai')
var Error      = require('errno-codes')
var proxyquire = require('proxyquire')
var sinon      = require('sinon')
var sinonChai  = require('sinon-chai')

var utils = require('../')

var should  = chai.should()
var plugins = {sinon: sinonChai}

chai.use(plugins.sinon)


describe('execInit', function () {

  // errors
  var UNKNOWN = Error.get(Error.UNKNOWN)
  var ENOENT  = Error.get(Error.ENOENT)
  var ENOTDIR = Error.get(Error.ENOTDIR)

  it('should be a function', function () {
    utils.execInit.should.be.a.function
  })
  it('should make stat call for the HOME argument', sinon.test(function () {
    var stat     = this.spy(fs, 'stat')
    var callback = this.spy()
    var execInit = utils.execInit

    execInit('/home', callback)

    stat.should.have.been.calledWithExactly('/home', sinon.match.func)
  }))
  it('should return every error excluding ENOENT on homeStat', sinon.test(function () {
    var stat = this.stub(fs, 'stat')
    var callback = this.spy()
    var execInit = utils.execInit

    stat.withArgs('/home', sinon.match.func).yields(UNKNOWN)

    execInit('/home', callback)

    callback.should.have.been.calledWith(UNKNOWN)
  }))
  it('should return "path not found" for ENOENT errors', sinon.test(function () {
    var stat = this.stub(fs, 'stat')
    var callback = this.spy()
    var execInit = utils.execInit

    stat.withArgs('/home', sinon.match.func).yields(ENOENT)

    execInit('/home', callback)

    callback.should.have.been.calledWithExactly(`/home not found`)
  }))
  it('should make a stat call for the init file', sinon.test(function () {
    var stat     = this.stub(fs, 'stat')
    var callback = this.spy()
    var execInit = utils.execInit

    stat.withArgs('/home', sinon.match.func).yields(null, {isFile: sinon.stub().returns(false)})
    stat.withArgs('/home/init', sinon.match.func).yields(null, {isFile: sinon.stub().returns(true)})

    execInit('/home', callback)

    stat.should.have.been.calledWithExactly('/home', sinon.match.func)
    stat.should.have.been.calledWithExactly('/home/init', sinon.match.func)
  }))
  it('should return every error excluding ENOENT on initStat', sinon.test(function () {
    var stat     = this.stub(fs, 'stat')
    var callback = this.spy()
    var execInit = utils.execInit

    stat.withArgs('/home', sinon.match.func).yields(null, {isFile: sinon.stub().returns(false)})
    stat.withArgs('/home/init', sinon.match.func).yields(UNKNOWN)

    execInit('/home', callback)

    callback.should.have.been.calledWith(UNKNOWN)
  }))
  it('should return "path not found" for ENOENT errors', sinon.test(function () {
    var stat     = this.stub(fs, 'stat')
    var callback = this.spy()
    var execInit = utils.execInit

    stat.withArgs('/home', sinon.match.func).yields(null, {isFile: sinon.stub().returns(false)})
    stat.withArgs('/home/init', sinon.match.func).yields(ENOENT)

    execInit('/home', callback)

    callback.should.have.been.calledWithExactly(`/home/init not found`)
  }))
  it('should check if the init stat is a file and return the callback with an error', sinon.test(function () {
    var homeStat = { gid: 0, uid: 0 }
    var initStat = { gid: undefined, uid: undefined, isFile: sinon.stub().returns(false) }

    var stat     = this.stub(fs, 'stat')
    var callback = this.spy()
    var execInit = utils.execInit

    stat.withArgs('/home', sinon.match.func).yields(null, homeStat)
    stat.withArgs('/home/init', sinon.match.func).yields(null, initStat)

    execInit('/home', callback)

    initStat.isFile.should.have.been.calledOnce
    callback.should.have.been.calledWithExactly('/home/init is not a file')
  }))
  it('should check if the home stat and the init stat have the same gid uid', sinon.test(function () {
    var homeStat = { gid: 0, uid: 0 }
    var initStat = { gid: 1, uid: 1, isFile: sinon.stub().returns(true) }

    var stat     = this.stub(fs, 'stat')
    var callback = this.spy()
    var execInit = utils.execInit

    stat.withArgs('/home', sinon.match.func).yields(null, homeStat)
    stat.withArgs('/home/init', sinon.match.func).yields(null, initStat)

    execInit('/home', callback)

    callback.should.have.been.calledWithExactly('/home uid & gid don\'t match with its init')
  }))
  it('should spawn the user init script', sinon.test(function () {
    var chrootInit = `${process.cwd()}/bin/chrootInit`
    var context    = { on: sinon.stub() }

    var callback = this.spy()
    var execInit = utils.execInit

    var stat     = this.stub(fs, 'stat')
    var spawn    = this.stub(proc, 'spawn')
    var homeStat = { gid: 0, uid: 0 }
    var initStat = { gid: 0, uid: 0, isFile: sinon.stub().returns(true) }

    stat.withArgs('/home', sinon.match.func).yields(null, homeStat)
    stat.withArgs('/home/init', sinon.match.func).yields(null, initStat)

    context.on.withArgs('exit', callback).returns()
    spawn.withArgs(chrootInit, [homeStat.uid, homeStat.gid],
                   {cwd: '/home', stdio: 'inherit'})
         .returns(context)

    execInit('/home', callback)

    spawn.should.have.been.calledWithExactly(chrootInit,
            [homeStat.uid, homeStat.gid], {cwd: '/home', stdio: 'inherit'})
    spawn.should.have.returned(context)
    context.on.should.have.been.calledOnce
  }))
})
