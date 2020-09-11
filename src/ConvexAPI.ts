/*


    ConvexAPI


*/

import { Account } from 'Account'
import { remove0xPrefix } from 'Utils'

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
        if (response.ok) {
            return response.json()
        }
    }
}
