/*


    Test ConvexAPI calls

*/

import chai, { assert, expect } from 'chai'
chai.use(require('chai-as-promised'))

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

TOPUP_AMOUNT = 1000000

function async topupAccount(convex: ConvexAPI, account: Account): Promise<number> {
    let balance = convex.balance(account)
    const amount = TOPUP_AMOUNT
    while ( balance < TOPUP_AMOUNT) {
        const result = await convex.requestFunds(amount, account)
        balance = await convex.balance(account)
    }
    return balance
}

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
        it('should throw a ConvexAPIRequestError on a syntax error', async () => {
            const convex = new ConvexAPI(CONVEX_URL)
            const account = Account.importFromString(PRIVATE_TEST_KEY_TEXT, PRIVATE_TEST_KEY_PASSWORD)
            const badLine = "(concat [*address*] 'test')"
            expect(
                convex.query(badLine, account)
            ).to.be.rejectedWith(/400/)

        })


        it('should throw a ConvexAPIError on a new account balance', async () => {
            const convex = new ConvexAPI(CONVEX_URL)
            const account = Account.createNew(PRIVATE_TEST_KEY_PASSWORD)
            const address = account.addressAPI
            expect(
                convex.query(`(balance "${address}")`, account)
            ).to.be.rejectedWith(/NOBODY/)
        })
        it('should return a valid checksum address from a query', async () => {
            const convex = new ConvexAPI(CONVEX_URL)
            const account = Account.importFromString(PRIVATE_TEST_KEY_TEXT, PRIVATE_TEST_KEY_PASSWORD)
            const address = account.addressAPI
            const result = await convex.query(`(address "${address}")`, account)
            assert.equal(result['value'], account.addressChecksum)
        })
    })

    describe('Balance query', async () => {
        it('should get a 0 balance on a new account', async () => {
            const convex = new ConvexAPI(CONVEX_URL)
            const account = Account.createNew(PRIVATE_TEST_KEY_PASSWORD)
            const value = await convex.balance(account)
            assert.equal(value, 0)
        })
        it('should get a small balance on a new account', async () => {
            const convex = new ConvexAPI(CONVEX_URL)
            const account = Account.createNew(PRIVATE_TEST_KEY_PASSWORD)
            const amount = 100
            const result = await convex.requestFunds(amount, account)
            assert.equal(result, amount)
            const value = await convex.balance(account)
            assert.equal(value, amount)
        })
        it('should get a small balance on a new account using the address only field', async () => {
            const convex = new ConvexAPI(CONVEX_URL)
            const account = Account.createNew(PRIVATE_TEST_KEY_PASSWORD)
            const amount = 100
            const result = await convex.requestFunds(amount, account)
            assert.equal(result, amount)
            const value = await convex.balance(account.address)
            assert.equal(value, amount)
        })
    })

    describe('Send transactions', async () => {
        it('should send transactions to the network', async () => {
            const convex = new ConvexAPI(CONVEX_URL)
            const account = Account.importFromString(PRIVATE_TEST_KEY_TEXT, PRIVATE_TEST_KEY_PASSWORD)
            await topupAccount(convex, account)
            const line = '(map inc [1 2 3 4 5])'
            const result = await convex.submit(line, account)
            assert(result)
            console.log(result)
        })
    })
    describe('Address query', async () => {
        it('should get a function address from a new deployed function', async () => {
            const convex = new ConvexAPI(CONVEX_URL)
            const testFunctionDeploy = `
(def storage-example-address
  (deploy
   '(do
     (def stored-data nil)
     (defn get [] stored-data)
     (defn set [x] (def stored-data x))
     (export get set))))
`
            const result = convex.send(testFunctionDeploy, account)
            assert(result)
        })
    })


})
