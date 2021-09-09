/*


    Test ConvexAPI calls

*/

import chai, { assert } from 'chai'
chai.use(require('chai-as-promised'))
import { randomBytes } from 'crypto'

import { API, KeyPair } from '../../src'
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

describe('API Class', () => {
    describe('requestFunds', async () => {
        it('should request funds from a new account', async () => {
            const convex = API.create(CONVEX_URL)
            const keyPair = KeyPair.create()
            const account = await convex.createAccount(keyPair)
            const amount = 1000
            const result = await convex.requestFunds(amount, account)
            assert.equal(result, amount)
        })

        it('should request funds from the test account', async () => {
            const convex = API.create(CONVEX_URL)
            const importKeyPair = KeyPair.importFromString(PRIVATE_TEST_KEY_TEXT, PRIVATE_TEST_KEY_PASSWORD)
            const account = await convex.createAccount(importKeyPair)
            const amount = 1000000
            const result = await convex.requestFunds(amount, account)
            assert.equal(result, amount)
        })
    })

    describe('query', async () => {

        it('should throw a ConvexAPIError on a new account balance', async () => {
            const convex = API.create(CONVEX_URL)
            const address = Number.MAX_SAFE_INTEGER
            const result = await convex.query(`(balance #${address})`, BigInt(9))
            assert.isNull(result['value'])
        })

        it('should return a valid checksum address from a query', async () => {
            const convex = API.create(CONVEX_URL)
            const importKeyPair = KeyPair.importFromString(PRIVATE_TEST_KEY_TEXT, PRIVATE_TEST_KEY_PASSWORD)
            const account = await convex.createAccount(importKeyPair)
            const address = account.address
            const result = await convex.query(`(address #${address})`, account)
            assert.equal(result['value'], account.address)
        })
    })

    describe('getBalance', async () => {
        it('should get a 0 balance on a new account', async () => {
            const convex = API.create(CONVEX_URL)
            const keyPair = KeyPair.create()
            const account = await convex.createAccount(keyPair)
            const value = await convex.getBalance(account)
            assert.equal(value, 0)
        })

        it('should get a small balance on a new account', async () => {
            const convex = API.create(CONVEX_URL)
            const keyPair = KeyPair.create()
            const account = await convex.createAccount(keyPair)
            const amount = 100
            const result = await convex.requestFunds(amount, account)
            assert.equal(result, amount)
            const value = await convex.getBalance(account)
            assert.equal(value, amount)
        })

        it('should get a small balance on a new account using the address only field', async () => {
            const convex = API.create(CONVEX_URL)
            const keyPair = KeyPair.create()
            const account = await convex.createAccount(keyPair)
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
            convex = API.create(CONVEX_URL)
            const importKeyPair = KeyPair.importFromString(PRIVATE_TEST_KEY_TEXT, PRIVATE_TEST_KEY_PASSWORD)
            account = await convex.createAccount(importKeyPair)
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
     (def stored-data
        ^{:private? true}
        nil
     )
     (defn get
        ^{:callable? true}
        []
        stored-data
     )
     (defn set
        ^{:callable? true}
        [x]
        (def stored-data x)
     )
   )
  )
)
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
            convex = API.create(CONVEX_URL)
            const importKeyPair = KeyPair.importFromString(PRIVATE_TEST_KEY_TEXT, PRIVATE_TEST_KEY_PASSWORD)
            account = await convex.createAccount(importKeyPair)
            await convex.topupAccount(account)
            functionName = 'test-storage'
            const testFunctionDeploy = `
(def ${functionName}
  (deploy
   '(do
     (def stored-data
        ^{:private? true}
        nil
     )
     (defn get
        ^{:callable? true}
        []
        stored-data
     )
     (defn set
        ^{:callable? true}
        [x]
        (def stored-data x)
     )
   )
 )
)
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
        let importKeyPair
        let accountName
        before( async () => {
            convex = API.create(CONVEX_URL)
            importKeyPair = KeyPair.importFromString(PRIVATE_TEST_KEY_TEXT, PRIVATE_TEST_KEY_PASSWORD)
            accountName = 'test.convex-api.' + randomBytes(4).toString('hex')
        })
        it('should fail to reslove a new named account',  async() => {
            const result = await convex.resolveAccountName(accountName, importKeyPair)
            assert(!result)
        })
        it('should fail to load a new named account',  async() => {
            const result = await convex.loadAccount(accountName, importKeyPair)
            assert(!result)
        })
    })

    describe('accountNames register and load', async () => {
        let convex
        let importKeyPair
        let accountName
        let newAccount
        before( async () => {
            convex = API.create(CONVEX_URL)
            importKeyPair = KeyPair.importFromString(PRIVATE_TEST_KEY_TEXT, PRIVATE_TEST_KEY_PASSWORD)
            accountName = 'test.convex-api.' + randomBytes(4).toString('hex')
        })
        it('should setup and setup/create a new named account',  async() => {
            newAccount = await convex.setupAccount(accountName, importKeyPair)
            assert(newAccount)
            assert(newAccount.address)
            assert(newAccount.name)
        })
        it('should resolve the address of the new named account',  async() => {
            const result = await convex.resolveAccountName(accountName, importKeyPair)
            assert(result)
            assert.equal(result, newAccount.address)
        })
        it('should load the new named account',  async() => {
            const result = await convex.loadAccount(accountName, importKeyPair)
            assert(result)
            assert.equal(result.address, newAccount.address)
            assert.equal(result.name, newAccount.name)
        })
        it('should resolve the address of the new named account after a clear cache',  async() => {
            convex.registry.clearCache()
            const result = await convex.resolveAccountName(accountName, importKeyPair)
            assert(result)
            assert.equal(result, newAccount.address)
        })
    })

    describe('registry', async () => {
        let convex
        before( async () => {
            convex = API.create(CONVEX_URL)
        })
        it('should resolve to a third party library or actor', async() => {
            const address = await convex.resolveName('convex.asset')
            assert(address)
        })
    })

    describe('getAccountInfo', async () => {
        let convex
        let account
        before( async () => {
            convex = API.create(CONVEX_URL)
            const importKeyPair = KeyPair.importFromString(PRIVATE_TEST_KEY_TEXT, PRIVATE_TEST_KEY_PASSWORD)
            account = await convex.createAccount(importKeyPair)
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
            convex = API.create(CONVEX_URL)
            const importKeyPair = KeyPair.importFromString(PRIVATE_TEST_KEY_TEXT, PRIVATE_TEST_KEY_PASSWORD)
            accountFrom = await convex.createAccount(importKeyPair)
            await convex.topupAccount(accountFrom)
        })

        it('should transfer a set amount of funds from the test account to a new account', async () => {
            const keyPair = KeyPair.create()
            const accountTo = await convex.createAccount(keyPair)
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
            convex = API.create(CONVEX_URL)
            const importKeyPair = KeyPair.importFromString(PRIVATE_TEST_KEY_TEXT, PRIVATE_TEST_KEY_PASSWORD)
            account = await convex.createAccount(importKeyPair)
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
        let importKeyPair
        before( async () => {
            convex = API.create(CONVEX_URL)
            importKeyPair = KeyPair.importFromString(PRIVATE_TEST_KEY_TEXT, PRIVATE_TEST_KEY_PASSWORD)
        })
        it('should run multiple createAccount test', async () => {
            const requestCount = 20
            let results = Array(requestCount)
            // first send transactions all at once
            for ( let counter = 0; counter < requestCount; counter ++ ) {
                results[counter] = convex.createAccount(importKeyPair)
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
