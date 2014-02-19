# Crypto.coffee
# Handles all the cryptography code

Promise    = require('bluebird')
base64     = require('urlsafe-base64')
nodeCrypto = require('crypto')
bcrypt     = Promise.promisifyAll(require('bcrypt'))

# - hash
# - compare hash
# - random bytes
# - random tokens
# - reset tokens
# - login tokens

crypto =

  ###
   * crypto.hash
   *
   * Hash some data using bcrypt with a randomly generated salt.
   *
   * salt:rounds = 10
   *
   * - data (string)
   * > hashed data (string)
  ###

  hash: (data) ->
    bcrypt.hashAsync(data, 10)


  ###
   * crypto.compare
   *
   * Check to see if some data matches a hash.
   *
   * - data (string)
   * - hash (string)
   * > boolean
  ###

  compare: (data, hash) ->
    bcrypt.compareAsync(data, hash)


  ###
   * crypto.fastHash
   *
   * Quickly hash some data.
   * Used to protect random tokens
   *
   * - data (string) : plaintext
   * > string : base64 encoded (NOT URL SAFE)
  ###


  fastHash: (data) ->
    nodeCrypto.createHash('sha256')
    .update(data, 'utf-8')
    .digest('base64')


  ###
   * crypto.fastCompare
   *
   * Quickly check some data against a 'fastHash'
   *
   * - data (string) : plaintext
   * - hash (string) : hash
   * > boolean
  ###

  fastCompare: (data, hash) ->
    crypto.fastHash(data) is hash


  ###
   * crypto.randomBytes
   *
   * Generates secure random data.
   * Wrap crypto.randomBytes in a promise.
   *
   * - len (int) : number of bytes to get
   * > random data (buffer)
  ###

  randomBytes: Promise.promisify(nodeCrypto.randomBytes, crypto)


  ###
   * crypto.randomToken
   *
   * Generate a random string of a certain length.
   * It generates random bytes and then converts them to url safe base64.
   *
   * 3 bytes is equal to 4 base64 chars.
   * To optimize the amount of random bytes we generate,
   * we multiple the length by 3/4 and add 1.
   * This generates just enough bytes, and then we trim the output to match
   * the original length;
   *
   * - len (int) : The length of the string
   * > random token (string)
  ###

  randomToken: (len) ->
    byteLen = Math.floor(len * 0.75) + 1
    crypto.randomBytes(byteLen).then (buf) ->
      base64.encode(buf)[0 ... len]

module.exports = crypto