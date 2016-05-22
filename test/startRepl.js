'use strict'

var utils   = require('../')
var repl  = require('repl')
var sinon   = require('sinon')
var chai    = require('chai')
var should  = chai.should()
var plugins = { sinon: require('sinon-chai') }
    chai.use(plugins.sinon)

describe('startRepl', function () {

  it('should be a function', function () {
    utils.startRepl.should.be.a.function
  })
  it('should log "Starting REPL session"', sinon.test(function () {
    var startRepl = utils.startRepl
    var log = this.spy(console, 'log')

    startRepl('nodeos >')

    log.should.have.been.calledOnce
    log.should.have.been.calledWith('Starting REPL session')
  }))
  it('should start a repl', sinon.test(function () {
    var startRepl = utils.startRepl
    var start = this.stub(repl, 'start')
    var on = this.spy()

    start.withArgs('nodeos> ').returns({ on: on })

    startRepl('nodeos')

    start.should.have.been.calledOnce
    start.should.have.been.calledWith('nodeos> ')
    start.should.have.returned(sinon.match.object)
    on.should.have.been.calledOnce
    on.should.have.been.calledWith('exit', sinon.match.func)
  }))
  it('should call process.exit(2) and print "Got exit event from repl!"', sinon.test(function () {
    var startRepl = utils.startRepl
    var start = this.stub(repl, 'start')
    var log = this.stub(console, 'log')
    var on = this.stub()
    var exit = this.stub(process, 'exit')

    start.withArgs('nodeos> ').returns({ on: on })
    on.withArgs('exit', sinon.match.func).yields()
    exit.withArgs(2).returns()

    startRepl('nodeos')

    log.should.have.been.calledWith('Starting REPL session')

    start.should.have.been.calledOnce
    start.should.have.been.calledWith('nodeos> ')
    start.should.have.returned(sinon.match.object)

    on.should.have.been.calledOnce
    on.should.have.been.calledWith('exit', sinon.match.func)

    log.should.have.been.calledWith('Got "exit" event from repl!')
    log.should.have.been.calledTwice

    exit.should.have.been.calledWith(2)
  }))
})
