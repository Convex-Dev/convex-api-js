
import fs from 'fs'
import { assert } from 'chai'
import { KeyPair } from '../../src'

const PUBLIC_KEY = '5288fec4153b702430771dfac8aed0b21cafca4344dae0d47b97f0bf532b3306'

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

describe('KeyPair class tests', () => {
    describe('Key pair import from string', () => {
        it('should load a private PEM key text', () => {
            const keyPair = KeyPair.importFromString(PRIVATE_TEST_KEY_TEXT, PRIVATE_TEST_KEY_PASSWORD)
            assert(keyPair)
            assert.equal(keyPair.publicKey.asymmetricKeyType, 'ed25519')
            assert.equal(keyPair.privateKey.asymmetricKeyType, 'ed25519')
            assert.equal(keyPair.publicKeyAPI, PUBLIC_KEY)
        })
    })
    describe('Create new key pair', () => {
        it('should create a new key pair with a new key pair', () => {
            const keyPair = KeyPair.create()
            assert(keyPair)
            assert.equal(keyPair.publicKey.asymmetricKeyType, 'ed25519')
            assert.equal(keyPair.privateKey.asymmetricKeyType, 'ed25519')
        })
    })

    describe('Export keys', () => {
        it('should export/import key pair key too text', () => {
            const keyPair = KeyPair.create()
            const text = keyPair.exportToString(PRIVATE_TEST_KEY_PASSWORD)
            assert(text)
            const keyPairRead = KeyPair.importFromString(text, PRIVATE_TEST_KEY_PASSWORD)
            assert.equal(keyPairRead.publicKeyAPI, keyPair.publicKeyAPI)
        })

        it('should export/import key pair key too file', async () => {
            const keyPair = KeyPair.create()
            let filename = '/tmp/testAccount.pem'
            if (fs.existsSync(filename)) {
                fs.unlinkSync(filename)
            }
            await keyPair.exportToFile(filename, PRIVATE_TEST_KEY_PASSWORD)
            const keyPairSaved = await KeyPair.importFromFile(filename, PRIVATE_TEST_KEY_PASSWORD)
            assert.equal(keyPairSaved.publicKeyAPI, keyPair.publicKeyAPI)
            fs.unlinkSync(filename)
        })
    })
    describe('Sign text', () => {
        it('should sign a standard hash text to produce a confirmed signed result', () => {
            const keyPair = KeyPair.importFromString(PRIVATE_TEST_KEY_TEXT, PRIVATE_TEST_KEY_PASSWORD)
            assert(keyPair)
            const value = keyPair.sign(SIGN_HASH_TEXT)
            assert.equal(value, SIGN_TEXT)
        })
    })
})
