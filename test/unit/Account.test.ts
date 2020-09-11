

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


describe('Account tests', () => {
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
            const account = Account.createNew(PRIVATE_TEST_KEY_PASSWORD)
            assert(account)
            assert.equal(account.publicKey.asymmetricKeyType, 'ed25519')
            assert.equal(account.privateKey.asymmetricKeyType, 'ed25519')
        })
    })
})
