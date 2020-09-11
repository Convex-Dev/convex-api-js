/*


    Test ConvexAPI calls

*/

import { assert } from 'chai'

import { Account } from '../../src/Account'
import { ConvexAPI } from '../../src/ConvexAPI'

const PRIVATE_TEST_KEY_TEXT = `
-----BEGIN ENCRYPTED PRIVATE KEY-----
MIGbMFcGCSqGSIb3DQEFDTBKMCkGCSqGSIb3DQEFDDAcBAi3qm1zgjCO5gICCAAw
DAYIKoZIhvcNAgkFADAdBglghkgBZQMEASoEENjvj1nzc0Qy22L+Zi+n7yIEQMLW
o++Jzwlcg3PbW1Y2PxicdFHM3dBOgTWmGsvfZiLhSxTluXTNRCZ8ZLL5pi7JWtCl
JAr4iFzPLkM18YEP2ZE=
-----END ENCRYPTED PRIVATE KEY-----
`

const PRIVATE_TEST_KEY_PASSWORD = 'secret'

const CONVEX_URL = 'https://convex.world'

describe('ConvexAPI Class', () => {
    describe('requestFunds', async () => {
        it('should request funds from a new account', async () => {
            const convex = new ConvexAPI(CONVEX_URL)
            const account = Account.createNew(PRIVATE_TEST_KEY_PASSWORD)
            const amount = 1000
            const result = await convex.requestFunds(amount, account)
            assert.equal(result, amount)
        })
        it('should request funds from the test account', async () => {
            const convex = new ConvexAPI(CONVEX_URL)
            const account = Account.importFromString(PRIVATE_TEST_KEY_TEXT, PRIVATE_TEST_KEY_PASSWORD)
            const amount = 1000000
            const result = await convex.requestFunds(amount, account)
            assert.equal(result, amount)
        })

    })
    describe('Basic Query tests', async () => {
        it('should return a valid checksum address from a query', async () => {
            const convex = new ConvexAPI(CONVEX_URL)
            const account = Account.importFromString(PRIVATE_TEST_KEY_TEXT, PRIVATE_TEST_KEY_PASSWORD)
            const address = account.addressAPI
            const result = await convex.query(`(address "${address}")`, account)
            assert.equal(result['value'], account.addressChecksum)
        })
    })
})
