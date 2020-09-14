/*


    ConvexAPI


*/

import { Account } from 'Account'
import { remove0xPrefix } from 'Utils'
import { ConvexAPIRequestError, ConvexAPIError } from 'Errors'

import fetch from 'node-fetch'
import urljoin from 'url-join'

export class ConvexAPI {
    readonly url: string        // url of the convex network

    /**
     * Initaliizes a new ConvexAPI object, you need to provide the URL of a Convex Network Node.
     *
     * @param url URL of the convex network node.
     *
     */
    public constructor(url: string) {
        this.url = url
    }

    /**
     * Request funds from the development account. This method only works on development and test
     * networks that provide free funds.
     *
     * @param amount The amount to request.
     * @param account The Account object to request funds for.
     *
     * @returns The amount of funds provided for this request.
     *
     */
    public async requestFunds(amount: number, account: Account): Promise<number> {
        const queryURL = urljoin(this.url, '/api/v1/faucet')
        const data = {
            address: account.addressAPI,
            amount: amount,
        }
        const response = await fetch(queryURL, {
            method: 'POST',
            body: JSON.stringify(data),
        })
        if (response.ok) {
            const result = await response.json()
            return parseInt(result['value'])
        }
        return 0
    }

    /**
     * Get the current balance of an account.
     *
     * @param addressAccount Account object or string address of the account to get the balance.
     *
     * @returns The balance of funds held by the account address.
     *
     */
    public async getBalance(addressAccount: string | Account): Promise<number> {
        let address
        let balance = 0
        if (typeof addressAccount === 'string') {
            address = remove0xPrefix(addressAccount)
        } else {
            address = addressAccount.addressAPI
        }
        try {
            const transaction = `(balance "${address}")`
            const result = await this.transaction_query(address, transaction)
            balance = result['value']
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
     * @param addressAccount Account or address string to use as the query address. This address
     * is the address used by the owner of the deployed function
     *
     * @returns The address of the deployed function
     *
     */
    public async getAddress(functionName: string, addressAccount: string | Account): Promise<string> {
        let address
        if (typeof addressAccount === 'string') {
            address = remove0xPrefix(addressAccount)
        } else {
            address = addressAccount.addressAPI
        }
        const transaction = `(address ${functionName})`
        const result = await this.transaction_query(address, transaction)
        return result['value']
    }

    /**
     * Transfer funds from one account to another.
     *
     * @param toAddressAccount To address string or account , that the funds need to be sent too.
     * @param amount Amount to send for the transfer.
     * @param fromAccount Account to send the funds from. This must be an account object so that the transfer transaction
     * can be sent from the account.
     *
     * @results The amount of funds transfered.
     *
     */
    public async transfer(toAddressAccount: string | Account, amount: number, fromAccount: Account): Promise<number> {
        let toAddress
        if (typeof toAddressAccount === 'string') {
            toAddress = remove0xPrefix(toAddressAccount)
        } else {
            toAddress = toAddressAccount.addressAPI
        }
        const transaction = `(transfer "${toAddress}" ${amount})`
        const result = await this.send(transaction, fromAccount)
        return result['value']
    }

    /**
     * Send a transaction to the network. This assumes that the network state will change, and as a result
     * a transaction fee will be deducted from the  account.
     *
     * @param transaction State changing transaction to execute.
     * @param account Account to sign the transaction.
     *
     * @returns The result from executing the transaction.
     *
     */
    public async send(transaction: string, account: Account): Promise<unknown> {
        const hashResult = await this.transaction_prepare(account.address, transaction)
        const hashData = hashResult['hash']
        const signedData = account.sign(hashData)
        return this.transaction_submit(account.address, hashData, signedData)
    }

    /**
     * Send a query transaction to the network. A query transaction does not change the network state
     *  and so does not need any funds to perform a transaction. Possible query transactions are balance query, address
     * query and calling read operations in contracts.
     *
     * @param transaction Read only transaction to perform.
     * @prama addressAccount Address string or Account object to use for the query transaction.
     *
     * @returns The query results.
     *
     */
    public async query(transaction: string, addressAccount: string | Account): Promise<unknown> {
        let address
        if (typeof addressAccount === 'string') {
            address = remove0xPrefix(addressAccount)
        } else {
            address = addressAccount.addressAPI
        }
        return this.transaction_query(address, transaction)
    }

    protected async transaction_prepare(address: string, transaction: string): Promise<unknown> {
        const prepareURL = urljoin(this.url, '/api/v1/transaction/prepare')
        const data = {
            address: remove0xPrefix(address),
            lang: 'convex-lisp',
            source: transaction,
        }
        return this.do_transaction_post('transaction_prepare', prepareURL, data)
    }

    protected async transaction_submit(address: string, hashData: string, signedData: string): Promise<unknown> {
        const submitURL = urljoin(this.url, '/api/v1/transaction/submit')
        const data = {
            address: remove0xPrefix(address),
            hash: hashData,
            sig: remove0xPrefix(signedData),
        }
        return this.do_transaction_post('transaction_submit', submitURL, data)
    }

    protected async transaction_query(address: string, transaction: string): Promise<unknown> {
        const queryURL = urljoin(this.url, '/api/v1/query')
        const data = {
            address: address,
            lang: 'convex-lisp',
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
        if (result['error-code']) {
            throw new ConvexAPIError(name, result['error-code'], result['value'])
        }
        return result
    }
}
