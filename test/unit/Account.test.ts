
import fs from 'fs'
import { assert } from 'chai'
import { Account } from '../../src/Account'

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


const SIGN_HASH_TEXT = '5bb1ce718241bfec110552b86bb7cccf0d95b8a5f462fbf6dff7c48543622ba5'
const SIGN_TEXT = '0x7eceffab47295be3891ea745838a99102bfaf525ec43632366c7ec3f54db4822b5d581573aecde94c420554f963baebbf412e4304ad8636886ddfa7b1049f70e'

describe('Account class tests', () => {
    describe('Key pair import from string', () => {
        it('should load a private PEM key text', () => {
            const account = Account.importFromString(PRIVATE_TEST_KEY_TEXT, PRIVATE_TEST_KEY_PASSWORD)
            assert(account)
            assert.equal(account.publicKey.asymmetricKeyType, 'ed25519')
            assert.equal(account.privateKey.asymmetricKeyType, 'ed25519')
            assert.equal(account.address, PUBLIC_ADDRESS)
        })
    })
    describe('Create new key pair', () => {
        it('should create a new account with a new key pair', () => {
            const account = Account.createNew()
            assert(account)
            assert.equal(account.publicKey.asymmetricKeyType, 'ed25519')
            assert.equal(account.privateKey.asymmetricKeyType, 'ed25519')
        })
    })

    describe('Export keys', () => {
        it('should export/import account key too text', () => {
            const account = Account.createNew()
            const text = account.exportToText(PRIVATE_TEST_KEY_PASSWORD)
            assert(text)
            const accountRead = Account.importFromString(text, PRIVATE_TEST_KEY_PASSWORD)
            assert.equal(accountRead.address, account.address)
        })

        it('should export/import account key too file', async () => {
            const account = Account.createNew()
            let filename = '/tmp/testAccount.pem'
            if (fs.existsSync(filename)) {
                fs.unlinkSync(filename)
            }
            await account.exportToFile(filename, PRIVATE_TEST_KEY_PASSWORD)
            const accountSaved = await Account.importFromFile(filename, PRIVATE_TEST_KEY_PASSWORD)
            assert.equal(accountSaved.address, account.address)
            fs.unlinkSync(filename)
        })
    })
    describe('Sign text', () => {
        it('should sign a standard hash text to produce a confirmed signed result', () => {
            const account = Account.importFromString(PRIVATE_TEST_KEY_TEXT, PRIVATE_TEST_KEY_PASSWORD)
            assert(account)
            const value = account.sign(SIGN_HASH_TEXT)
            assert.equal(value, SIGN_TEXT)
        })
    })
})
