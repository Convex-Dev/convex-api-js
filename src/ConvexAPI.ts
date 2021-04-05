/*


    ConvexAPI


*/
import { randomBytes } from 'crypto'

import { ConvexAccount } from './ConvexAccount'
import { remove0xPrefix } from './Utils'
import { ConvexAPIRequestError, ConvexAPIError } from './Errors'
import { IConvexAccountInformation, IRegistryItem } from './Interfaces'
import { Registry } from './Registry'

import fetch from 'node-fetch'
import urljoin from 'url-join'

const enum Language {
    Lisp = 'convex-lisp',
    Scrypt = 'convex-scrypt',
}

const TOPUP_ACCOUNT_MIN_BALANCE = BigInt(10000000)

export class ConvexAPI {
    /**
     * URL of the network
     */
    readonly url: string

    /**
     * Default language to use
     */
    language: Language

    /**
     * Registry used to resolve account names
     */
    registry: Registry

    /**
     * Initaliizes a new ConvexAPI object, you need to provide the URL of a Convex Network Node.
     *
     * @param url URL of the convex network node.
     *
     * @example
     *
     * ```js
     * const convex = new ConvexAPI('https://convex.world')
     * ```
     *
     */
    public constructor(url: string, language?: Language) {
        this.url = url
        if (!language) {
            this.language = Language.Lisp
        }
        this.registry = new Registry(this)
    }

    /**
     * Create a new account address with the convex network. You can provide an already
     * existing account Public/Private keys or leave empty, and a new ConvexAccount will be created.
     *
     *
     * @param account Optional ConvexAccount object to assign the new address too.
     *
     * @returns A ConvexAccount object with a new account address.
     *
     * @example
     *
     * ```js
     * // create a new account with a random keys and new address
     * const newAccount = await convex.createAccount()
     *
     * // Create an account with our own keys, but with a new address
     * importAccount = ConvexAccount.importFromFile('my-account.pem', 'secret')
     * const accountWithNewAddress = await convex.createAccount(importAccount)
     * ```
     *
     *
     */
    public async createAccount(account?: ConvexAccount): Promise<ConvexAccount> {
        let newAccount: ConvexAccount = account

        if (!account) {
            newAccount = ConvexAccount.create()
        }

        const queryURL = urljoin(this.url, '/api/v1/createAccount')
        const data = {
            accountKey: newAccount.publicKeyAPI,
        }
        const response = await fetch(queryURL, {
            method: 'POST',
            body: JSON.stringify(data),
        })
        if (response.ok) {
            const result = await response.json()
            const password = randomBytes(64).toString('hex')
            const accounText = newAccount.exportToText(password)
            return ConvexAccount.importFromString(accounText, password, BigInt(result['address']))
        }
        return null
    }

    /**
     * Request funds from the development account. This method only works on development and test
     * networks that provide free funds.
     *
     * @param amount The amount to request.
     * @param account The ConvexAccount object to request funds for.
     *
     * @returns The amount of funds provided for this request.
     *
     * @example
     *
     * ```js
     * const fundsRequested = await convex.requestFunds(100000, account)
     * console.log(`requested ${fundsRequested} funds for account at address ${account.address}`)
     * ```
     *
     */
    public async requestFunds(amount: BigInt | number, account: ConvexAccount): Promise<BigInt> {
        const queryURL = urljoin(this.url, '/api/v1/faucet')
        const data = {
            address: parseInt(account.address.toString()),
            amount: parseInt(BigInt(amount).toString()),
        }
        const response = await fetch(queryURL, {
            method: 'POST',
            body: JSON.stringify(data),
        })
        if (response.ok) {
            const result = await response.json()
            return BigInt(result['value'])
        }
        return BigInt(0)
    }

    /**
     * Topup account to a minimum balance
     *
     * @param account The convex account to topup
     * @param minBalance The minimum balance the account should be topped too
     * @param retryCount Number of times to try loop around and topup the account
     *
     * @returns the amount of funds transfered to the account
     *
     * @example
     *
     * ```js
     * const amount = await convex.topupAccount(account)
     * console.log(`${amount} tokens was topped up to account at address ${account.address}`)
     * ```
     *
     */
    public async topupAccount(account: ConvexAccount, minBalance?: BigInt, retryCount?: number): Promise<BigInt> {
        minBalance = minBalance ? minBalance : TOPUP_ACCOUNT_MIN_BALANCE
        retryCount = retryCount ? retryCount : 8
        const requestAmount: BigInt = TOPUP_ACCOUNT_MIN_BALANCE
        let transferAmount: BigInt = BigInt(0)
        while (minBalance > (await this.getBalance(account)) && retryCount > 0) {
            transferAmount = transferAmount.valueOf() + (await this.requestFunds(requestAmount, account)).valueOf()
            retryCount -= 1
        }
        return transferAmount
    }

    /**
     * Get the current balance of an account.
     *
     * @param addressAccount ConvexAccount object or BigInt address of the account to get the balance.
     *
     * @returns The balance of funds held by the account address.
     *
     * @example
     *
     * ```js
     *
     * const balance = await convex.balance(account)
     * console.log(`balance of ${balance} for account at address ${account.address}`)
     *
     * const sameBalance = await convex.balance(account.address)
     * console.log(`balance of ${sameBalance} for account at address ${account.address}`)
     *
     * const mainFundBalance = await convex.balance(9)
     * console.log(`main fund balance of ${mainFundBalance} for address #9`)
     * ```
     *
     */
    public async getBalance(addressAccount: BigInt | ConvexAccount): Promise<BigInt> {
        let address: BigInt
        let balance: BigInt = BigInt(0)
        if (Object.prototype.toString.call(addressAccount) === '[object BigInt]') {
            address = BigInt(addressAccount)
        } else {
            address = (<ConvexAccount>addressAccount).address
        }
        try {
            let transaction = `(balance ${address})`
            if (this.language == Language.Scrypt) {
                transaction = `balance (${address})`
            }
            const result = await this.transaction_query(address, transaction, this.language)
            if (result['value']) {
                balance = BigInt(result['value'])
            }
        } catch (error) {
            if (error.name == 'ConvexAPIError' && error.code === 'NOBODY') {
                return balance
            }
            throw error
        }
        return balance
    }

    /**
     * Get the address of a deployed function. The function must be owned by the account address passed,
     * for this method to work.
     *
     * @param functionName The deployed function go get the address off.
     * @param addressAccount ConvexAccount or address BigInt to use as the query address. This address
     * is the address used by the owner of the deployed function
     *
     * @returns The address of the deployed function
     *
     */
    public async getAddress(functionName: string, addressAccount: BigInt | ConvexAccount): Promise<string> {
        let address
        if (Object.prototype.toString.call(addressAccount) === '[object BigInt]') {
            address = addressAccount
        } else {
            address = (<ConvexAccount>addressAccount).address
        }
        let transaction = `(address ${functionName})`
        if (this.language == Language.Scrypt) {
            transaction = `address (${functionName})`
        }
        const result = await this.transaction_query(address, transaction, this.language)
        return result['value']
    }

    /**
     * Request account information, from the convex network.
     *
     * @param addressAccount ConvexAccount or address BigInt to use as the query the account.
     *
     * @returns The account information of the type IConvexAccountInformation, for example:
     *
     * @example
     *
     * ```js
     *  await convex.getAccountInfo(account)
     *
     *  {
     *      "address": "405",
     *      "is_library": false,
     *      "is_actor": false,
     *      "memory_size": 75,
     *      "allowance": 10000000,
     *      "type": "user",
     *      "balance": 10000000000,
     *      "sequence": 0,
     *      "environment": {}
     * }
     *
     */
    public async getAccountInfo(addressAccount: BigInt | ConvexAccount): Promise<IConvexAccountInformation> {
        let address
        if (Object.prototype.toString.call(addressAccount) === '[object BigInt]') {
            address = addressAccount
        } else {
            address = (<ConvexAccount>addressAccount).address
        }
        const queryURL = urljoin(this.url, `/api/v1/accounts/${address}`)
        return <IConvexAccountInformation>await this.do_transaction_get('getAccountInfo', queryURL)
    }

    /**
     * Loads an account using the account name. The name must be registered by using `registerAccountName` or the
     * `accountSetup` method.
     *
     * @param name: Name of the registered account to load.
     * @param account: ConvexAccount to use for the key to load.
     *
     * @returns A ConvexAccount with the account name and adderss set.
     *
     * @example
     *
     * ```js
     * // get the current account keys we need to use
     * const importAccount = await ConvexAccount.importFromFile('account_file.pem', 'secret')
     *
     * // load the account from an account name already registered.
     * const account = await convex.loadAccount('my-account-name', importAccount)
     *
     * ```
     */

    public async loadAccount(name: string, account: ConvexAccount): Promise<ConvexAccount> {
        const address: BigInt = await this.resolveAccountName(name)
        if (address) {
            return ConvexAccount.importFromAccount(account, address, name)
        }
    }

    /**
     * Setup an account by registering the account name or by loading the account using a pre registered name.
     *
     * @param name: name of the account to register or has already been registered.
     * @param account: ConvexAccount to use for the public/private keys
     *
     * @returns A ConvexAccount with the account name and adderss set.
     *
     * @example
     * ```js
     * // get the current account keys we need to use
     * const importAccount = await ConvexAccount.importFromFile('account_file.pem', 'secret')
     *
     * // creates a new account address or loads the account from an account name already registered.
     * const account = await convex.setupAccount('my-account-name', importAccount)
     *
     * ```
     *
     */
    public async setupAccount(name: string, account: ConvexAccount): Promise<ConvexAccount> {
        let newAccount
        const address: BigInt = await this.resolveAccountName(name)
        if (address) {
            newAccount = ConvexAccount.importFromAccount(account, address, name)
        } else {
            newAccount = await this.createAccount(account)
            await this.topupAccount(newAccount)
            newAccount = await this.registerAccountName(name, newAccount)
        }
        await this.topupAccount(newAccount)
        return newAccount
    }

    /**
     * Register an account name with the CNS ( Convex Named Service), this name can be used in the convex
     * sandbox or used by the API libraries to resolve an account name to an account address.
     *
     * @param name: name of the account to register
     * @param account: Account to spend the fee to register and use the address.
     * @param address: Optional address to use to register this instead of using the accounts address.
     *
     * @returns an account object with the address set
     *
     * @example
     *
     * ```js
     * // load the account from an account name already registered.
     * const registerAccount = await convex.loadAccount('my-registration-account', importAccount)
     *
     * // create a new account with a new address
     * let newAccount = await convex.createAccount(importAccount)
     *
     * // now we can register the name for the new account, by paying for the fees from the registerAccount
     * newAccount = await convex.registerAccountName('my-new-name', registerAccount, newAccount.address)
     *
     * ```
     *
     */
    public async registerAccountName(name: string, account: ConvexAccount, address?: BigInt): Promise<ConvexAccount> {
        if (!address) {
            address = account.address
        }
        if (address) {
            const item: IRegistryItem = await this.registry.register(`account.${name}`, address, account)
            return ConvexAccount.importFromAccount(account, item.address, name)
        }
    }

    /**
     * Resolve an account name, if found return the account address registered with this account name.
     *
     * @param name Name of the registered account
     *
     * @returns Address of the registered account or nil
     *
     * @example
     *
     * ```js
     * // resolve to find the address of an account
     * const accountAddress = await convex.resolveAccountName('my-account')
     *
     * ```
     */
    public async resolveAccountName(name: string): Promise<BigInt> {
        return this.registry.resolveAddress(`account.${name}`)
    }

    /**
     * Resolve a name, if found return the address registered with this name in the Convex Name Services.
     *
     * @param name Name of the service
     *
     * @returns Address of the registered service
     *
     * @example
     *
     * ```js
     * // resolve to find the address of a library or actor
     * const nftTokenLibraryAddress = await convex.resolveName('covex.nft-token')
     *
     * ```
     */
    public async resolveName(name: string): Promise<BigInt> {
        return this.registry.resolveAddress(name)
    }

    /**
     * Transfer funds from one account to another.
     *
     * @param toAddressAccount To address BigInt or account , that the funds need to be sent too.
     * @param amount Amount to send for the transfer.
     * @param fromAccount ConvexAccount to send the funds from. This must be an account object so that the transfer transaction
     * can be sent from the account.
     *
     * @results The amount of funds transfered.
     *
     * @example
     *
     * ```js
     * // load the account from an account name already registered.
     * const fundingAccount = await convex.loadAccount('my-funding-account', importAccount)
     * const newAccount = await convex.createAccount(importAccount)
     *
     * // send 1000000 tokens from the fundingAccount to the newAccount
     * const amount = await convex.transfer(newAccount, 1000000, fundingAccount)
     *
     *
     * ```
     *
     */
    public async transfer(
        toAddressAccount: BigInt | ConvexAccount,
        amount: BigInt | number,
        fromAccount: ConvexAccount
    ): Promise<BigInt> {
        let toAddress
        if (Object.prototype.toString.call(toAddressAccount) === '[object BigInt]') {
            toAddress = toAddressAccount
        } else {
            toAddress = (<ConvexAccount>toAddressAccount).address
        }
        let transaction = `(transfer ${toAddress} ${amount})`
        if (this.language == Language.Scrypt) {
            transaction = `transfer (${toAddress} ${amount})`
        }
        const result = await this.send(transaction, fromAccount)
        return result['value']
    }

    /**
     * Send a transaction to the network. This assumes that the network state will change, and as a result
     * a transaction fee will be deducted from the  account.
     *
     * @param transaction State changing transaction to execute.
     * @param account ConvexAccount to sign the transaction.
     *
     * @returns The result from executing the transaction.
     *
     * @example
     * ```js
     * const resultSend = await convex.send('(map inc [1 2 3 4 5])', account)
     * consol.log(`Result from calculation ${resultSend}`)
     * ```
     *
     *
     */
    public async send(transaction: string, account: ConvexAccount, language?: Language): Promise<unknown> {
        let transaction_language = this.language
        let retry_counter = 20
        let result = null
        if (language) {
            transaction_language = language
        }
        while (retry_counter > 0 && result == null) {
            // const info = await this.getAccountInfo(account)
            try {
                // console.log('trying ', retry_counter)
                const hashResult = await this.transaction_prepare(account.address, transaction, transaction_language)
                const hashData = hashResult['hash']
                const signedData = account.sign(hashData)
                result = await this.transaction_submit(account.address, account.publicKeyAPI, hashData, signedData)
            } catch (error) {
                // console.log(error)
                if (error.code === 'SEQUENCE') {
                    // console.log('sequence error', retry_counter)
                    if (retry_counter == 0) {
                        throw error
                    }
                    retry_counter -= 1
                    await new Promise((request) => setTimeout(request, 1000 + Math.random() * 2000))
                    result = null
                } else {
                    throw error
                }
            }
        }
        return result
    }

    /**
     * Send a query transaction to the network. A query transaction does not change the network state
     *  and so does not need any funds to perform a transaction. Possible query transactions are balance query, address
     * query and calling read operations in contracts.
     *
     * @param transaction Read only transaction to perform.
     * @prama addressAccount Address BigInt or ConvexAccount object to use for the query transaction.
     *
     * @returns The query results.
     *
     * @example
     *
     * ```js
     * const resultQuery = await convex.query('(balance *address*)', account.address)
     * consol.log(`Result from a query ${resultQuery}`)
     * ```
     *
     */
    public async query(transaction: string, addressAccount: BigInt | ConvexAccount, language?: Language): Promise<unknown> {
        let transaction_language = this.language
        if (language) {
            transaction_language = language
        }
        let address
        if (Object.prototype.toString.call(addressAccount) === '[object BigInt]') {
            address = addressAccount
        } else {
            address = (<ConvexAccount>addressAccount).address
        }
        return this.transaction_query(address, transaction, transaction_language)
    }

    protected async transaction_prepare(
        address: BigInt,
        transaction: string,
        language: Language,
        sequenceNumber?: BigInt
    ): Promise<unknown> {
        const prepareURL = urljoin(this.url, '/api/v1/transaction/prepare')
        const data = {
            address: parseInt(address.toString()),
            lang: language,
            source: transaction,
            sequence: sequenceNumber,
        }
        return this.do_transaction_post('transaction_prepare', prepareURL, data)
    }

    protected async transaction_submit(address: BigInt, publicKey: string, hashData: string, signedData: string): Promise<unknown> {
        const submitURL = urljoin(this.url, '/api/v1/transaction/submit')
        const data = {
            address: parseInt(address.toString()),
            accountKey: remove0xPrefix(publicKey),
            hash: hashData,
            sig: remove0xPrefix(signedData),
        }
        return this.do_transaction_post('transaction_submit', submitURL, data)
    }

    protected async transaction_query(address: BigInt, transaction: string, language: Language): Promise<unknown> {
        const queryURL = urljoin(this.url, '/api/v1/query')
        const data = {
            address: parseInt(address.toString()),
            lang: language,
            source: transaction,
        }
        return this.do_transaction_post('transaction_query', queryURL, data)
    }
    protected async do_transaction_post(name: string, url: string, data: unknown): Promise<unknown> {
        const response = await fetch(url, {
            method: 'POST',
            body: JSON.stringify(data),
        })
        if (await !response.ok) {
            throw new ConvexAPIRequestError(name, await response.status, await response.statusText)
        }

        const result = await response.json()
        if (result['errorCode']) {
            throw new ConvexAPIError(name, result['errorCode'], result['value'])
        }
        return result
    }
    protected async do_transaction_get(name: string, url: string): Promise<unknown> {
        const response = await fetch(url, {
            method: 'GET',
        })
        if (await !response.ok) {
            throw new ConvexAPIRequestError(name, await response.status, await response.statusText)
        }

        const result = await response.json()
        if (result['errorCode']) {
            throw new ConvexAPIError(name, result['errorCode'], result['value'])
        }
        return result
    }
}
