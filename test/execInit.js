'use strict'

var fs         = require('fs')
var proc       = require('child_process')
var utils      = require('../')
var Error      = require('errno-codes')
var proxyquire = require('proxyquire')
var sinon      = require('sinon')
var chai       = require('chai')
var should     = chai.should()
var plugins    = { sinon: require('sinon-chai') }
    chai.use(plugins.sinon)

describe('execInit', function () {

  // errors
  var UNKNOWN = Error.get(Error.UNKNOWN)
  var ENOENT = Error.get(Error.ENOENT)
  var ENOTDIR = Error.get(Error.ENOTDIR)

  it('should be a function', function () {
    utils.execInit.should.be.a.function
  })
  it('should make statSync call for the HOME argument', sinon.test(function () {
    var statSync = this.spy(fs, 'statSync')
    var callback = this.spy()
    var execInit = utils.execInit

    execInit('/home', [], callback)

    statSync.should.have.been.calledWithExactly('/home')
  }))
  it('should return every error exculding ENOENT on homeStat', sinon.test(function () {
    var statSync = this.stub(fs, 'statSync')
    statSync.withArgs('/home').throws(UNKNOWN)

    var callback = this.spy()
    var execInit = utils.execInit

    execInit('/home', [], callback)

    statSync.should.have.thrown(UNKNOWN)
    callback.should.have.been.calledWith(UNKNOWN)
  }))
  it('should return "path not found" for ENOENT errors', sinon.test(function () {
    var statSync = this.stub(fs, 'statSync')
    statSync.withArgs('/home').throws(ENOENT)

    var callback = this.spy()
    var execInit = utils.execInit

    execInit('/home', [], callback)

    statSync.should.have.thrown(ENOENT)
    callback.should.have.been.calledWithExactly(`/home not found`)
  }))
  it('should make a statSync call for the init file', sinon.test(function () {
    var statSync = this.spy(fs, 'statSync')
    var callback = this.spy()
    var execInit = utils.execInit

    execInit('/home', [], callback)

    statSync.should.have.been.calledWithExactly('/home')
    statSync.should.have.been.calledWithExactly('/home/init')
  }))
  it('should return every error excluding ENOENT on initStat', sinon.test(function () {
    var statSync = this.stub(fs, 'statSync')
    statSync.withArgs('/home/init').throws(UNKNOWN)

    var callback = this.spy()
    var execInit = utils.execInit

    execInit('/home', [], callback)

    statSync.should.have.thrown(UNKNOWN)
    callback.should.have.been.calledWith(UNKNOWN)
  }))
  it('should return "path not found" for ENOENT errors', sinon.test(function () {
    var statSync = this.stub(fs, 'statSync')
    statSync.withArgs('/home/init').throws(ENOENT)

    var callback = this.spy()
    var execInit = utils.execInit

    execInit('/home', [], callback)

    statSync.should.have.thrown(ENOENT)
    callback.should.have.been.calledWithExactly(`/home/init not found`)
  }))
  it('should check if the init stat is a file and return the callback with an error', sinon.test(function () {
    var statSync = this.stub(fs, 'statSync')
    var homeStat = { gid: 0, uid: 0 }
    var initStat = { gid: undefined, uid: undefined, isFile: sinon.stub().returns(false) }
    statSync.withArgs('/home').returns(homeStat)
    statSync.withArgs('/home/init').returns(initStat)

    var callback = this.spy()
    var execInit = utils.execInit

    execInit('/home', [], callback)

    statSync.should.have.returned(homeStat)
    statSync.should.have.returned(initStat)
    initStat.isFile.should.have.been.calledOnce
    callback.should.have.been.calledWithExactly('/home/init is not a file')
  }))
  it('should check if the home stat and the init stat have the same gid uid', sinon.test(function () {
    var statSync = this.stub(fs, 'statSync')
    var homeStat = { gid: 0, uid: 0 }
    var initStat = { gid: 1, uid: 1, isFile: sinon.stub().returns(true) }
    statSync.withArgs('/home').returns(homeStat)
    statSync.withArgs('/home/init').returns(initStat)

    var callback = this.spy()
    var execInit = utils.execInit

    execInit('/home', [], callback)

    statSync.should.have.returned(homeStat)
    statSync.should.have.returned(initStat)
    callback.should.have.been.calledWithExactly('/home uid & gid don\'t match with its init')
  }))
  it('should spawn the user init script', sinon.test(function () {
    var chrootInit = `${process.cwd()}/bin/chrootInit`
    var context    = { on: sinon.stub() }

    var callback = this.spy()
    var execInit = utils.execInit

    var statSync = this.stub(fs, 'statSync')
    var spawn    = this.stub(proc, 'spawn')
    var homeStat = { gid: 0, uid: 0 }
    var initStat = { gid: 0, uid: 0, isFile: sinon.stub().returns(true) }
    statSync.withArgs('/home').returns(homeStat)
    statSync.withArgs('/home/init').returns(initStat)

    context.on.withArgs('exit', callback).returns(undefined)
    spawn.withArgs(chrootInit, [homeStat.uid, homeStat.gid], { cwd: '/home', stdio: 'inherit' })
         .returns(context)

    execInit('/home', [], callback)

    statSync.should.have.returned(homeStat)
    statSync.should.have.returned(initStat)
    spawn.should.have.been.calledWithExactly(chrootInit, [ homeStat.uid, homeStat.gid ], { cwd: '/home', stdio: 'inherit' })
    spawn.should.have.returned(context)
    context.on.should.have.been.calledOnce
  }))
})
