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

    public async balance(addressAccount: string | Account): Promise<number> {
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

    public async address(functionName: string, addressAccount: string | Account): Promise<number> {
        let address
        let result
        if (typeof addressAccount === 'string') {
            address = remove0xPrefix(addressAccount)
        } else {
            address = addressAccount.addressAPI
        }
        try {
            const transaction = `(addres "${functionName}")`
            result = await this.transaction_query(address, transaction)
        } catch (error) {
            throw error
        }
        return result['value']
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
        if (await response.ok) {
            const result = await response.json()
            if (result['error-code']) {
                throw new ConvexAPIError('query', result['error-code'], result['value'])
            }
            return result
        }
        throw new ConvexAPIRequestError('query', await response.status, await response.message)
    }
}
