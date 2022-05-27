
import fs from 'fs'
import { assert } from 'chai'
import { KeyPair } from '../../src'

const PUBLIC_KEY = '5288Fec4153b702430771DFAC8AeD0B21CAFca4344daE0d47B97F0bf532b3306'

/*
import { decomposePrivateKey } from 'crypto-key-composer'


const PRIVATE_TEST_KEY_TEXT = `
-----BEGIN ENCRYPTED PRIVATE KEY-----
MIGbMFcGCSqGSIb3DQEFDTBKMCkGCSqGSIb3DQEFDDAcBAi3qm1zgjCO5gICCAAw
DAYIKoZIhvcNAgkFADAdBglghkgBZQMEASoEENjvj1nzc0Qy22L+Zi+n7yIEQMLW
o++Jzwlcg3PbW1Y2PxicdFHM3dBOgTWmGsvfZiLhSxTluXTNRCZ8ZLL5pi7JWtCl
JAr4iFzPLkM18YEP2ZE=
-----END ENCRYPTED PRIVATE KEY-----
`
const privateKeyData = decomposePrivateKey(PRIVATE_TEST_KEY_TEXT, {
    format: 'pkcs8-pem',
    password: PRIVATE_TEST_KEY_PASSWORD,
})
const privateKey = privateKeyData.keyData.seed
const key = await KeyPair.createFromPrivateKey(privateKey)

*/
const PRIVATE_ENCRYPTED_KEY = 'U2FsdGVkX1+zZPlLL1zR8ac9kCp+lHWGsjpUwBINwhpnTJWlu4TctG/Zha/8Mx0ZXjMbb73KZN+N/pBawfTmmw=='

const PRIVATE_TEST_KEY_PASSWORD = 'secret'


const SIGN_HASH_TEXT = '5bb1ce718241bfec110552b86bb7cccf0d95b8a5f462fbf6dff7c48543622ba5'
const SIGN_TEXT = '0x7eceffab47295be3891ea745838a99102bfaf525ec43632366c7ec3f54db4822b5d581573aecde94c420554f963baebbf412e4304ad8636886ddfa7b1049f70e'

const TEST_KEY_FILE = 'test/resources/test_keyfile.dat'

describe('KeyPair class tests', () => {
    describe('Key pair from PEM to new format', async () => {
        it('should import and export a new encrypted format', async () => {

            const key = await KeyPair.importFromString(PRIVATE_ENCRYPTED_KEY, PRIVATE_TEST_KEY_PASSWORD)
            assert.equal(key.publicKeyChecksum, '0x' + PUBLIC_KEY)

            const encryptedPrivateKey = key.exportToString(PRIVATE_TEST_KEY_PASSWORD)

            const recoverKey = await KeyPair.importFromString(encryptedPrivateKey, PRIVATE_TEST_KEY_PASSWORD)
            assert.equal(recoverKey.privateKey.toString(), key.privateKey.toString())
            assert.equal(recoverKey.publicKeyAPI, key.publicKeyAPI)
            assert.equal(recoverKey.publicKeyChecksum, '0x' + PUBLIC_KEY)


            const recoverKey2 = await KeyPair.importFromString(PRIVATE_ENCRYPTED_KEY, PRIVATE_TEST_KEY_PASSWORD)
            assert.equal(recoverKey2.privateKey.toString(), key.privateKey.toString())
            assert.equal(recoverKey2.publicKeyAPI, key.publicKeyAPI)
            assert.equal(recoverKey2.publicKeyChecksum, '0x' + PUBLIC_KEY)

        })

    })
    describe('Key pair import from string', () => {
        it('should load a private PEM key text', async () => {
            const keyPair = await KeyPair.importFromString(PRIVATE_ENCRYPTED_KEY, PRIVATE_TEST_KEY_PASSWORD)
            assert(keyPair)
            // assert.equal(keyPair.publicKey.asymmetricKeyType, 'ed25519')
            // assert.equal(keyPair.privateKey.asymmetricKeyType, 'ed25519')
            assert.equal(keyPair.publicKeyAPI, PUBLIC_KEY)
        })
    })
    describe('Create new key pair', () => {
        it('should create a new key pair with a new key pair', async () => {
            const keyPair = await KeyPair.create()
            assert(keyPair)
            // assert.equal(keyPair.publicKey.asymmetricKeyType, 'ed25519')
            // assert.equal(keyPair.privateKey.asymmetricKeyType, 'ed25519')
        })
    })

    describe('Import and Export keys', () => {
        it('should export/import key pair key too text', async () => {
            const keyPair = await KeyPair.create()
            const text = keyPair.exportToString(PRIVATE_TEST_KEY_PASSWORD)
            assert(text)
            const keyPairRead = await KeyPair.importFromString(text, PRIVATE_TEST_KEY_PASSWORD)
            assert.equal(keyPairRead.publicKeyAPI, keyPair.publicKeyAPI)
        })

        it('should export/import key pair key too file', async () => {
            const keyPair = await KeyPair.create()
            let filename = '/tmp/testAccount.pem'
            if (fs.existsSync(filename)) {
                fs.unlinkSync(filename)
            }
            await keyPair.exportToFile(filename, PRIVATE_TEST_KEY_PASSWORD)
            const keyPairSaved = await KeyPair.importFromFile(filename, PRIVATE_TEST_KEY_PASSWORD)
            assert.equal(keyPairSaved.publicKeyAPI, keyPair.publicKeyAPI)
            fs.unlinkSync(filename)
        })
        it('should import key from test key file', async () => {
            const keyPair = await KeyPair.importFromString(PRIVATE_ENCRYPTED_KEY, PRIVATE_TEST_KEY_PASSWORD)
            assert(keyPair)

            const keyPairSaved = await KeyPair.importFromFile(TEST_KEY_FILE, PRIVATE_TEST_KEY_PASSWORD)
            assert.equal(keyPairSaved.publicKeyAPI, keyPair.publicKeyAPI)
        })
    })
    describe('Sign text', () => {
        it('should sign a standard hash text to produce a confirmed signed result', async () => {
            const keyPair = await KeyPair.importFromString(PRIVATE_ENCRYPTED_KEY, PRIVATE_TEST_KEY_PASSWORD)
            assert(keyPair)
            const value = await keyPair.sign(SIGN_HASH_TEXT)
            assert.equal(value, SIGN_TEXT)
        })
    })
})
