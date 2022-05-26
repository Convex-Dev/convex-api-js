

import { assert } from 'chai'
import * as ed25519 from '@noble/ed25519'
import { decomposePrivateKey } from 'crypto-key-composer'

const PUBLIC_KEY_HEX = '0x5288fec4153b702430771dfac8aed0b21cafca4344dae0d47b97f0bf532b3306'

const PRIVATE_TEST_KEY_TEXT = `
-----BEGIN ENCRYPTED PRIVATE KEY-----
MIGbMFcGCSqGSIb3DQEFDTBKMCkGCSqGSIb3DQEFDDAcBAi3qm1zgjCO5gICCAAw
DAYIKoZIhvcNAgkFADAdBglghkgBZQMEASoEENjvj1nzc0Qy22L+Zi+n7yIEQMLW
o++Jzwlcg3PbW1Y2PxicdFHM3dBOgTWmGsvfZiLhSxTluXTNRCZ8ZLL5pi7JWtCl
JAr4iFzPLkM18YEP2ZE=
-----END ENCRYPTED PRIVATE KEY-----
`

const PRIVATE_TEST_KEY_PASSWORD = 'secret'

const SIGN_HASH_TEXT = '5bb1ce718241bfec110552b86bb7cccf0d95b8a5f462fbf6dff7c48543622ba5'
const SIGN_TEXT = '0x7eceffab47295be3891ea745838a99102bfaf525ec43632366c7ec3f54db4822b5d581573aecde94c420554f963baebbf412e4304ad8636886ddfa7b1049f70e'


describe('Basic Crypto tests', () => {
    describe('Create a new key pair', () => {
        it('should create a new key pair', async () => {
            const privateKey = ed25519.utils.randomPrivateKey()
            const publicKey = await ed25519.getPublicKey(privateKey)
            assert(privateKey)
            assert(publicKey)
        })
    })
    describe('Key pair importing', () => {
        it('should load a private PEM key file', async () => {


            const privateKeyData = decomposePrivateKey(PRIVATE_TEST_KEY_TEXT, {
                format: 'pkcs8-pem',
                password: PRIVATE_TEST_KEY_PASSWORD,
            })
            const privateKey = privateKeyData.keyData.seed
            assert(privateKey)

            const publicKey = await ed25519.getPublicKey(privateKey)
            assert(publicKey)

            assert.equal(PUBLIC_KEY_HEX, '0x' +  ed25519.utils.bytesToHex(publicKey))
        })
    })
    describe('Sign a message', () => {
        it('should sign a message with the correct result', async () => {

            const privateKeyData = decomposePrivateKey(PRIVATE_TEST_KEY_TEXT, {
                format: 'pkcs8-pem',
                password: PRIVATE_TEST_KEY_PASSWORD,
            })
            const privateKey = privateKeyData.keyData.seed
            assert(privateKey)
            const data = await ed25519.sign(Buffer.from(SIGN_HASH_TEXT, 'hex'), privateKey)
            assert.equal(SIGN_TEXT, '0x' + ed25519.utils.bytesToHex(data))

        })
    })
})
