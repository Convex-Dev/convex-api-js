/*


    ConvexAPI


*/

import { Account } from 'Account'
import { remove0xPrefix } from 'Utils'
import { ConvexAPIRequestError, ConvexAPIError } from 'Errors'

import fetch from 'node-fetch'
import urljoin from 'url-join'

export class ConvexAPI {
    readonly url: string

    public constructor(url: string) {
        this.url = url
    }

    public async query(transaction: string, addressAccount: string | Account): Promise<unknown> {
        let address
        if (typeof addressAccount === 'string') {
            address = remove0xPrefix(addressAccount)
        } else {
            address = addressAccount.addressAPI
        }
        return this.transaction_query(address, transaction)
    }

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

    public async getAddress(functionName: string, addressAccount: string | Account): Promise<string> {
        let address
        let result
        if (typeof addressAccount === 'string') {
            address = remove0xPrefix(addressAccount)
        } else {
            address = addressAccount.addressAPI
        }
        try {
            const transaction = `(address ${functionName})`
            result = await this.transaction_query(address, transaction)
        } catch (error) {
            throw error
        }
        return result['value']
    }

    public async send(transaction: string, account: Account): Promise <unknown> {
        const hashResult = await this.transaction_prepare(account.address, transaction)
        const hashData = hashResult['hash']
        const signedData = account.sign(hashData)
        return this.transaction_submit(account.address, hashData, signedData)
    }

    protected async transaction_prepare(address: string, transaction: string): Promise<unknown> {
        const prepareURL = urljoin(this.url, '/api/v1/transaction/prepare')
        const data = {
            address: remove0xPrefix(address),
            lang: 'convex-lisp',
            source: transaction,
        }
        const response = await fetch(prepareURL, {
            method: 'POST',
            body: JSON.stringify(data),
        })
        if (await !response.ok) {
            throw new ConvexAPIRequestError('transaction_prepare', await response.status, await response.statusText)
        }
        const result = await response.json()
        if (result['error-code']) {
            throw new ConvexAPIError('transaction_prepare', result['error-code'], result['value'])
        }
        return result
    }

    protected async transaction_submit(address: string, hashData: string, signedData: string): Promise<unknown> {
        const submitURL = urljoin(this.url, '/api/v1/transaction/submit')
        const data = {
            address: remove0xPrefix(address),
            hash: hashData,
            sig: remove0xPrefix(signedData),
        }
        const response = await fetch(submitURL, {
            method: 'POST',
            body: JSON.stringify(data),
        })
        if (await !response.ok) {
            throw new ConvexAPIRequestError('transaction_submit', await response.status, await response.statusText)
        }
        const result = await response.json()
        if (result['error-code']) {
            throw new ConvexAPIError('transaction_submit', result['error-code'], result['value'])
        }
        return result
    }

    protected async transaction_query(address: string, transaction: string): Promise<unknown> {
        const queryURL = urljoin(this.url, '/api/v1/query')
        const data = {
            address: address,
            lang: 'convex-lisp',
            source: transaction,
        }
        const response = await fetch(queryURL, {
            method: 'POST',
            body: JSON.stringify(data),
        })
        if (await !response.ok) {
            throw new ConvexAPIRequestError('transaction_query', await response.status, await response.statusText)
        }

        const result = await response.json()
        if (result['error-code']) {
            throw new ConvexAPIError('transaction_query', result['error-code'], result['value'])
        }
        return result
    }
}
