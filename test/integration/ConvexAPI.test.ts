/*


    Test ConvexAPI calls

*/

import chai, { assert, expect } from 'chai'
chai.use(require('chai-as-promised'))

import { ConvexAccount, ConvexAPI } from '../../src'
import { isAddress } from '../../src/Utils'

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

const TOPUP_AMOUNT = 1000000
const MIN_BALANCE = TOPUP_AMOUNT * 10


async function topupAccount(convex: ConvexAPI, account: ConvexAccount, minBalance?: number): Promise<number> {
    let balance = await convex.getBalance(account)
//    console.log('topup start balance', balance)
    const amount = TOPUP_AMOUNT
    const toBalance = minBalance ? minBalance : TOPUP_AMOUNT
    while ( balance < toBalance) {
        const result = await convex.requestFunds(amount, account)
        assert(result)
        balance = await convex.getBalance(account)
    }
//    console.log('topup end balance', balance)
    return balance
}

describe('ConvexAPI Class', () => {
    describe('requestFunds', async () => {
        it('should request funds from a new account', async () => {
            const convex = new ConvexAPI(CONVEX_URL)
            const account = ConvexAccount.createNew()
            const amount = 1000
            const result = await convex.requestFunds(amount, account)
            assert.equal(result, amount)
        })

        it('should request funds from the test account', async () => {
            const convex = new ConvexAPI(CONVEX_URL)
            const account = ConvexAccount.importFromString(PRIVATE_TEST_KEY_TEXT, PRIVATE_TEST_KEY_PASSWORD)
            const amount = 1000000
            const result = await convex.requestFunds(amount, account)
            assert.equal(result, amount)
        })
    })

    describe('query', async () => {
        it('should throw a ConvexAPIRequestError on a syntax error', async () => {
            const convex = new ConvexAPI(CONVEX_URL)
            const account = ConvexAccount.importFromString(PRIVATE_TEST_KEY_TEXT, PRIVATE_TEST_KEY_PASSWORD)
            const badLine = "(concat [*address*] 'test')"
            expect(
                convex.query(badLine, account)
            ).to.be.rejectedWith(/400/)

        })

        it('should throw a ConvexAPIError on a new account balance', async () => {
            const convex = new ConvexAPI(CONVEX_URL)
            const account = ConvexAccount.createNew()
            const address = account.addressAPI
            expect(
                convex.query(`(balance "${address}")`, account)
            ).to.be.rejectedWith(/NOBODY/)
        })

        it('should return a valid checksum address from a query', async () => {
            const convex = new ConvexAPI(CONVEX_URL)
            const account = ConvexAccount.importFromString(PRIVATE_TEST_KEY_TEXT, PRIVATE_TEST_KEY_PASSWORD)
            const address = account.addressAPI
            const result = await convex.query(`(address "${address}")`, account)
            assert.equal('0x' + result['value'], account.addressChecksum)
        })
    })

    describe('getBalance', async () => {
        it('should get a 0 balance on a new account', async () => {
            const convex = new ConvexAPI(CONVEX_URL)
            const account = ConvexAccount.createNew()
            const value = await convex.getBalance(account)
            assert.equal(value, 0)
        })

        it('should get a small balance on a new account', async () => {
            const convex = new ConvexAPI(CONVEX_URL)
            const account = ConvexAccount.createNew()
            const amount = 100
            const result = await convex.requestFunds(amount, account)
            assert.equal(result, amount)
            const value = await convex.getBalance(account)
            assert.equal(value, amount)
        })

        it('should get a small balance on a new account using the address only field', async () => {
            const convex = new ConvexAPI(CONVEX_URL)
            const account = ConvexAccount.createNew()
            const amount = 100
            const result = await convex.requestFunds(amount, account)
            assert.equal(result, amount)
            const value = await convex.getBalance(account.address)
            assert.equal(value, amount)
        })
    })

    describe('send', async () => {
        let convex
        let account
        before( async () => {
            convex = new ConvexAPI(CONVEX_URL)
            account = ConvexAccount.importFromString(PRIVATE_TEST_KEY_TEXT, PRIVATE_TEST_KEY_PASSWORD)
            await topupAccount(convex, account, MIN_BALANCE)
        })

        it('should send a single transaction to the convex network', async () => {
            const line = '(map inc [1 2 3 4 5])'
            const result = await convex.send(line, account)
            assert(result)
            assert.deepEqual(result['value'], [ 2, 3, 4, 5, 6 ])
        })

        it('should deploy a test function', async () => {
            const testFunctionDeploy = `
(def storage-example-address
  (deploy
   '(do
     (def stored-data nil)
     (defn get [] stored-data)
     (defn set [x] (def stored-data x))
     (export get set))))
`
            const result = await convex.send(testFunctionDeploy, account)
            assert(result)
            assert(result['value'])
            assert(isAddress(result['value']))

        })
    })
    describe('getAddress', async () => {
        let convex
        let account
        let functionName
        let functionAddress
        before( async () => {
            convex = new ConvexAPI(CONVEX_URL)
            account = ConvexAccount.importFromString(PRIVATE_TEST_KEY_TEXT, PRIVATE_TEST_KEY_PASSWORD)
            await topupAccount(convex, account, MIN_BALANCE)
            functionName = 'test-storage'
            const testFunctionDeploy = `
(def ${functionName}
  (deploy
   '(do
     (def stored-data nil)
     (defn get [] stored-data)
     (defn set [x] (def stored-data x))
     (export get set))))
`
            const result = await convex.send(testFunctionDeploy, account)
            functionAddress = result['value']
            assert(functionAddress)
        })

        it('should get a function address from a new deployed function', async () => {
            const address = await convex.getAddress(functionName, account)
            assert(address)
            assert.equal(address, functionAddress)
        })
    })
    describe('getAccountInfo', async () => {
        let convex
        let account
        before( async () => {
            convex = new ConvexAPI(CONVEX_URL)
            account = ConvexAccount.importFromString(PRIVATE_TEST_KEY_TEXT, PRIVATE_TEST_KEY_PASSWORD)
            await topupAccount(convex, account, MIN_BALANCE)
        })
        it('should reqeust information about an account object', async() => {
            const result = await convex.getAccountInfo(account)
            assert(result)
            assert(result.sequence)
            assert(result.balance)
        })
        it('should reqeust information about an account adress', async() => {
            const result = await convex.getAccountInfo(account.address)
            assert(result)
            assert(result.sequence)
            assert(result.balance)
        })
    })
    describe('transfer', async () => {
        let convex
        let account
        before( async () => {
            convex = new ConvexAPI(CONVEX_URL)
            account = ConvexAccount.importFromString(PRIVATE_TEST_KEY_TEXT, PRIVATE_TEST_KEY_PASSWORD)
            await topupAccount(convex, account, MIN_BALANCE)
        })

        it('should transfer a set amount of funds from the test account to a new account', async () => {
            const accountNew =  ConvexAccount.createNew()
            const amount = 1000
            const transferAmount = await convex.transfer(accountNew, amount, account)
            assert.equal(transferAmount, amount)
            const balance = await convex.getBalance(accountNew)
            assert.equal(amount, balance)
        })
    })


    describe('multi threaded test', async () => {
        let convex
        let account
        before( async () => {
            convex = new ConvexAPI(CONVEX_URL)
            account = ConvexAccount.importFromString(PRIVATE_TEST_KEY_TEXT, PRIVATE_TEST_KEY_PASSWORD)
            await topupAccount(convex, account, MIN_BALANCE)
        })
        it('should run multiple transactions before waiting for the result on the convex network', async () => {
            let results = Array(10)
            // first send transactions all at once
            for ( let counter = 0; counter < 8; counter ++ ) {
                const line = '(map inc [1 2 3 4 5])'
                results[counter] = convex.send(line, account)
            }
            // now wait for the results
            for ( let counter = 0; counter < 8; counter ++ ) {
                let result = await results[counter]
                assert(result)
                assert.deepEqual(result['value'], [ 2, 3, 4, 5, 6 ])
            }
        }).timeout(20 * 1000)
    })
})
