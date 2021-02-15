/*


    ConvexAPI


*/
import { randomBytes } from 'crypto'

import { ConvexAccount } from './ConvexAccount'
import { remove0xPrefix } from './Utils'
import { ConvexAPIRequestError, ConvexAPIError } from './Errors'
import { IConvexAccountInformation } from './Interfaces'

import fetch from 'node-fetch'
import urljoin from 'url-join'

const enum Language {
    Lisp = 'convex-lisp',
    Scrypt = 'convex-scrypt',
}

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
     * Initaliizes a new ConvexAPI object, you need to provide the URL of a Convex Network Node.
     *
     * @param url URL of the convex network node.
     *
     */
    public constructor(url: string, language?: Language) {
        this.url = url
        if (!language) {
            this.language = Language.Lisp
        }
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
     * Get the current balance of an account.
     *
     * @param addressAccount ConvexAccount object or BigInt address of the account to get the balance.
     *
     * @returns The balance of funds held by the account address.
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
     *  {
     *      "address": "7E66429CA9c10e68eFae2dCBF1804f0F6B3369c7164a3187D6233683c258710f",
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
     * Transfer funds from one account to another.
     *
     * @param toAddressAccount To address BigInt or account , that the funds need to be sent too.
     * @param amount Amount to send for the transfer.
     * @param fromAccount ConvexAccount to send the funds from. This must be an account object so that the transfer transaction
     * can be sent from the account.
     *
     * @results The amount of funds transfered.
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
