

import { assert } from 'chai'
import { createPrivateKey, createPublicKey, generateKeyPairSync } from 'crypto'
import pem from 'pem-file'

const PUBLIC_ADDRESS = '0x5288fec4153b702430771dfac8aed0b21cafca4344dae0d47b97f0bf532b3306'

const PRIVATE_TEST_KEY_TEXT = `
-----BEGIN ENCRYPTED PRIVATE KEY-----
MIGbMFcGCSqGSIb3DQEFDTBKMCkGCSqGSIb3DQEFDDAcBAi3qm1zgjCO5gICCAAw
DAYIKoZIhvcNAgkFADAdBglghkgBZQMEASoEENjvj1nzc0Qy22L+Zi+n7yIEQMLW
o++Jzwlcg3PbW1Y2PxicdFHM3dBOgTWmGsvfZiLhSxTluXTNRCZ8ZLL5pi7JWtCl
JAr4iFzPLkM18YEP2ZE=
-----END ENCRYPTED PRIVATE KEY-----
`

const PRIVATE_TEST_KEY_PASSWORD = 'secret'


describe('Basic Crypto tests', () => {
    describe('Create a new key pair', () => {
        it('should create a new key pair', async () => {
            const { publicKey, privateKey } = generateKeyPairSync('ed25519', {
                publicKeyEncoding: { type: 'spki', format: 'pem' },
                privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
            })
            const privateKeyObj = createPrivateKey({
                key: privateKey,
                type: 'pkcs8',
            })
            const publicKeyObj = createPublicKey(publicKey)
            const publicKeyObjFromPrivate = createPublicKey(privateKey)
            assert.equal(privateKeyObj.asymmetricKeyType, 'ed25519')
            assert.equal(publicKeyObj.asymmetricKeyType, 'ed25519')
            assert.equal(publicKeyObjFromPrivate.asymmetricKeyType, 'ed25519')
            assert.equal(publicKeyObjFromPrivate.export({
                type: 'spki',
                format: 'pem',
            }), publicKeyObj.export({
                type: 'spki',
                format: 'pem',
            }))
        })
    })
    describe('Key pair importing using crypto', () => {
        it('should load a private PEM key file', async () => {

            const privateKey = createPrivateKey({
                key: PRIVATE_TEST_KEY_TEXT,
                type: 'pkcs8',
                passphrase: PRIVATE_TEST_KEY_PASSWORD
            })
            assert(privateKey)
            assert.equal(privateKey.asymmetricKeyType, 'ed25519')

            const publicKey = createPublicKey(privateKey)
            assert(publicKey)
            assert.equal(publicKey.asymmetricKeyType, 'ed25519')
            const exportKey = publicKey.export({
                type: 'spki',
                format: 'pem',
            })
            const publicKeyHex = '0x' + pem.decode(exportKey).toString('hex').substring(24)
            assert.equal(publicKeyHex, PUBLIC_ADDRESS)
        })
    })
/*
 *  does not work.. cannot find matching cipher
 *
 *
    describe('Find out the cipher used by python to encrypt the private key', () => {
        it('should be  a known cipher', () => {
            const privateKey = createPrivateKey({
                key: PRIVATE_TEST_KEY_TEXT,
                type: 'pkcs8',
                passphrase: PRIVATE_TEST_KEY_PASSWORD
            })
            getCiphers().forEach(cipher => {
                console.log(cipher)
                try {
                    const keyText = privateKey.export({
                        type: 'pkcs8',
                        format: 'pem',
                        cipher: cipher,
                        passphrase: PRIVATE_TEST_KEY_PASSWORD,
                    }).toString()
                    if ( keyText == PRIVATE_TEST_KEY_TEXT) {
                        console.log('!!!!!!!!!!!!!!!!! found ', cipher)
                        return
                    }
                } catch(error) {
                    console.log(error)
                }
            })
        })
    })
*/
})
