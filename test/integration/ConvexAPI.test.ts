/*


    Test ConvexAPI calls

*/

import chai, { assert, expect } from 'chai'
chai.use(require('chai-as-promised'))
import { randomBytes } from 'crypto'

import { ConvexAccount, ConvexAPI } from '../../src'
import { isAddress, toAddress } from '../../src/Utils'

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
const TOPUP_AMOUNT = 10000000

describe('ConvexAPI Class', () => {
    describe('requestFunds', async () => {
        it('should request funds from a new account', async () => {
            const convex = new ConvexAPI(CONVEX_URL)
            const account = await convex.createAccount()
            const amount = 1000
            const result = await convex.requestFunds(amount, account)
            assert.equal(result, amount)
        })

        it('should request funds from the test account', async () => {
            const convex = new ConvexAPI(CONVEX_URL)
            const importAccount = ConvexAccount.importFromString(PRIVATE_TEST_KEY_TEXT, PRIVATE_TEST_KEY_PASSWORD)
            const account = await convex.createAccount(importAccount)
            const amount = 1000000
            const result = await convex.requestFunds(amount, account)
            assert.equal(result, amount)
        })
    })

    describe('query', async () => {
        it('should throw a ConvexAPIRequestError on a syntax error', async () => {
            const convex = new ConvexAPI(CONVEX_URL)
            const importAccount = ConvexAccount.importFromString(PRIVATE_TEST_KEY_TEXT, PRIVATE_TEST_KEY_PASSWORD)
            const account = await convex.createAccount(importAccount)
            const badLine = "(concat [*address*] 'test')"
            expect(
                convex.query(badLine, account)
            ).to.be.rejectedWith(/400/)

        })

        it('should throw a ConvexAPIError on a new account balance', async () => {
            const convex = new ConvexAPI(CONVEX_URL)
            const address = Number.MAX_SAFE_INTEGER
            const result = await convex.query(`(balance ${address})`, BigInt(9))
            assert.isNull(result['value'])
        })

        it('should return a valid checksum address from a query', async () => {
            const convex = new ConvexAPI(CONVEX_URL)
            const importAccount = ConvexAccount.importFromString(PRIVATE_TEST_KEY_TEXT, PRIVATE_TEST_KEY_PASSWORD)
            const account = await convex.createAccount(importAccount)
            const address = account.address
            const result = await convex.query(`(address ${address})`, account)
            assert.equal(result['value'], account.address)
        })
    })

    describe('getBalance', async () => {
        it('should get a 0 balance on a new account', async () => {
            const convex = new ConvexAPI(CONVEX_URL)
            const account = await convex.createAccount()
            const value = await convex.getBalance(account)
            assert.equal(value, 0)
        })

        it('should get a small balance on a new account', async () => {
            const convex = new ConvexAPI(CONVEX_URL)
            const account = await convex.createAccount()
            const amount = 100
            const result = await convex.requestFunds(amount, account)
            assert.equal(result, amount)
            const value = await convex.getBalance(account)
            assert.equal(value, amount)
        })

        it('should get a small balance on a new account using the address only field', async () => {
            const convex = new ConvexAPI(CONVEX_URL)
            const account = await convex.createAccount()
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
            const importAccount = ConvexAccount.importFromString(PRIVATE_TEST_KEY_TEXT, PRIVATE_TEST_KEY_PASSWORD)
            account = await convex.createAccount(importAccount)
            await convex.topupAccount(account)
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
            const importAccount = ConvexAccount.importFromString(PRIVATE_TEST_KEY_TEXT, PRIVATE_TEST_KEY_PASSWORD)
            account = await convex.createAccount(importAccount)
            await convex.topupAccount(account)
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
            functionAddress = toAddress(result['value'])
            assert(functionAddress)
        })

        it('should get a function address using an account from a new deployed function', async () => {
            const address = await convex.getAddress(functionName, account)
            assert(address)
            assert.equal(address, functionAddress)
        })
        it('should get a function address using a string from a new deployed function', async () => {
            const address = await convex.getAddress(functionName, account.address)
            assert(address)
            assert.equal(address, functionAddress)
        })
//         it('should get a functon address from a standard contract', async () => {
//             const address = await convex.getAddress('starfish-ddo-registry', account.address)
//             assert(address)
//         })
    })

    describe('accountNames not resolved', async () => {
        let convex
        let importAccount
        let accountName
        before( async () => {
            convex = new ConvexAPI(CONVEX_URL)
            importAccount = ConvexAccount.importFromString(PRIVATE_TEST_KEY_TEXT, PRIVATE_TEST_KEY_PASSWORD)
            accountName = 'test.convex-api.' + randomBytes(4).toString('hex')
        })
        it('should fail to reslove a new named account',  async() => {
            const result = await convex.resolveAccountName(accountName, importAccount)
            assert(!result)
        })
        it('should fail to load a new named account',  async() => {
            const result = await convex.loadAccount(accountName, importAccount)
            assert(!result)
        })
    })

    describe('accountNames register and load', async () => {
        let convex
        let importAccount
        let accountName
        let newAccount
        before( async () => {
            convex = new ConvexAPI(CONVEX_URL)
            importAccount = ConvexAccount.importFromString(PRIVATE_TEST_KEY_TEXT, PRIVATE_TEST_KEY_PASSWORD)
            accountName = 'test.convex-api.' + randomBytes(4).toString('hex')
        })
        it('should setup and setup/create a new named account',  async() => {
            newAccount = await convex.setupAccount(accountName, importAccount)
            assert(newAccount)
            assert(newAccount.address)
            assert(newAccount.name)
        })
        it('should resolve the address of the new named account',  async() => {
            const result = await convex.resolveAccountName(accountName, importAccount)
            assert(result)
            assert.equal(result, newAccount.address)
        })
        it('should load the new named account',  async() => {
            const result = await convex.loadAccount(accountName, importAccount)
            assert(result)
            assert.equal(result.address, newAccount.address)
            assert.equal(result.name, newAccount.name)
        })
        it('should resolve the address of the new named account after a clear cache',  async() => {
            convex.registry.clearCache()
            const result = await convex.resolveAccountName(accountName, importAccount)
            assert(result)
            assert.equal(result, newAccount.address)
        })
    })

    describe('registry', async () => {
        let convex
        before( async () => {
            convex = new ConvexAPI(CONVEX_URL)
        })
        it('should resolve to a third party library or actor', async() => {
            const address = await convex.resolveName('convex.nft-tokens')
            assert(address)
        })
    })

    describe('getAccountInfo', async () => {
        let convex
        let account
        before( async () => {
            convex = new ConvexAPI(CONVEX_URL)
            const importAccount = ConvexAccount.importFromString(PRIVATE_TEST_KEY_TEXT, PRIVATE_TEST_KEY_PASSWORD)
            account = await convex.createAccount(importAccount)
            await convex.requestFunds(TOPUP_AMOUNT, account)
        })
        it('should reqeust information about an account object', async() => {
            const result = await convex.getAccountInfo(account)
            assert(result)
            assert.equal(result.address, account.address)
            assert(result.balance)
        })
        it('should reqeust information about an account adress', async() => {
            const result = await convex.getAccountInfo(account.address)
            assert(result)
            assert.equal(result.address, account.address)
            assert(result.balance)
        })
    })
    describe('transfer', async () => {
        let convex
        let accountFrom
        before( async () => {
            convex = new ConvexAPI(CONVEX_URL)
            const importAccount = ConvexAccount.importFromString(PRIVATE_TEST_KEY_TEXT, PRIVATE_TEST_KEY_PASSWORD)
            accountFrom = await convex.createAccount(importAccount)
            await convex.topupAccount(accountFrom)
        })

        it('should transfer a set amount of funds from the test account to a new account', async () => {
            const accountTo = await convex.createAccount()
            const amount = BigInt(1000)
            const transferAmount = await convex.transfer(accountTo, amount, accountFrom)
            assert.equal(transferAmount, amount)
            const balance = await convex.getBalance(accountTo)
            assert.equal(amount, balance)
        })
    })


    describe('multi threaded send test', async () => {
        let convex
        let account
        before( async () => {
            convex = new ConvexAPI(CONVEX_URL)
            const importAccount = ConvexAccount.importFromString(PRIVATE_TEST_KEY_TEXT, PRIVATE_TEST_KEY_PASSWORD)
            account = await convex.createAccount(importAccount)
            await convex.topupAccount(account)
        })
        it('should run multiple transactions before waiting for the result on the convex network', async () => {
            const sendCount = 20
            let results = Array(sendCount)
            // first send transactions all at once
            for ( let counter = 0; counter < sendCount; counter ++ ) {
                const line = '(map inc [1 2 3 4 5])'
                results[counter] = convex.send(line, account)
            }
            // now wait for the results
            for ( let counter = 0; counter < sendCount; counter ++ ) {
                let result = await results[counter]
                assert(result)
                assert.deepEqual(result['value'], [ 2, 3, 4, 5, 6 ])
            }
        }).timeout(20 * 1000)
    })

    describe('multi threaded createAccount test', async () => {
        let convex
        let importAccount
        before( async () => {
            convex = new ConvexAPI(CONVEX_URL)
            importAccount = ConvexAccount.importFromString(PRIVATE_TEST_KEY_TEXT, PRIVATE_TEST_KEY_PASSWORD)
        })
        it('should run multiple createAccount test', async () => {
            const requestCount = 20
            let results = Array(requestCount)
            // first send transactions all at once
            for ( let counter = 0; counter < requestCount; counter ++ ) {
                results[counter] = convex.createAccount(importAccount)
            }
            // now wait for the results
            for ( let counter = 0; counter < requestCount; counter ++ ) {
                let result = await results[counter]
                assert(result)
                assert(result.address)
            }
        }).timeout(20 * 1000)
    })


})
