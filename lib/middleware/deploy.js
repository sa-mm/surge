var request   = require("request")
var fsReader  = require('fstream-ignore')
var tar       = require('tar')
var zlib      = require('zlib')
var helpers   = require('./util/helpers')
var localCreds  = require("./util/creds.js")
var prompt      = helpers.prompt
var surge    = require('../surge')

module.exports = function(req, next){
  var upload = request.put("http://" + req.argv.endpoint + "/" + req.domain)
    .auth("token", req.creds.token, true)

  upload.on('response', function(rsp){
    if (rsp.statusCode == 200) {
      rsp.on('data', function(chunk){
        helpers.log(chunk.toString().grey)
      })

      rsp.on('end', function() {
        helpers.log('Updating DNS:', req.domain.green)
        next()
      })

    } else {
      localCreds(req.argv.endpoint).set(null)
      helpers.log()
      helpers.log("    Error:", rsp.statusCode.toString().red)
      helpers.log()
    }
  })

  /**
   * Pack
   */

  var pack = tar.Pack()

  /**
   * GZip
   */

  var zip = zlib.Gzip()

  var pkg = fsReader({ 'path': req.project, ignoreFiles: [".surgeignore"] })

  pkg.addIgnoreRules([".git"])

  pkg.pipe(pack).pipe(zip).pipe(upload)

}