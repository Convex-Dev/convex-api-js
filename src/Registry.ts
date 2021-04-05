/*


    Registry


*/

import { ConvexAccount } from './ConvexAccount'
import { ConvexAPI } from './ConvexAPI'
import { toAddress } from './Utils'
import { IRegistryItem } from './Interfaces'

const QUERY_ACCOUNT_ADDRESS = BigInt(9)

export class Registry {
    /**
     * Convex API object to call registry commands
     */
    readonly convex: ConvexAPI
    address: BigInt
    protected items: { [name: string]: IRegistryItem } = {}

    /**
     * Initaliizes a new Registry object, you need to provide a ConvexAPI Object.
     *
     * @param convex ConvexAPI object to access the convex network.
     *
     */
    public constructor(convex: ConvexAPI) {
        this.convex = convex
    }

    public clearCache(): void {
        this.items = {}
    }

    public async isRegistered(name: string): Promise<boolean> {
        return this.item(name) != null
    }

    public async item(name: string): Promise<IRegistryItem> {
        if (!this.items[name]) {
            const address = await this.getAddress()
            const queryLine = `(get cns-database (symbol "${name}"))`
            const result = await this.convex.query(queryLine, address)
            if (result && result['value']) {
                this.items[name] = {
                    address: toAddress(result['value'][0]),
                    owner: toAddress(result['value'][1]),
                }
            }
        }
        return this.items[name]
    }

    public async register(name: string, registerAddress: BigInt, account: ConvexAccount): Promise<IRegistryItem> {
        const address = await this.getAddress()
        const registerLine = `(call ${address} (register {:name "${name}"}))`
        const registerResult = await this.convex.send(registerLine, account)
        if (registerResult && registerResult['value']) {
            const updateLine = `(call ${address} (cns-update "${name}" ${registerAddress}))`
            const updateResult = await this.convex.send(updateLine, account)
            if (updateResult && updateResult['value']) {
                const items = updateResult['value']
                this.items[name] = {
                    address: toAddress(items[name][0]),
                    owner: toAddress(items[name][1]),
                }
                return this.items[name]
            }
        }
    }

    public async resolveOwner(name: string): Promise<BigInt> {
        const value = await this.item(name)
        if (value) {
            return value.owner
        }
    }

    public async resolveAddress(name: string): Promise<BigInt> {
        const value = await this.item(name)
        if (value) {
            return value.address
        }
    }

    protected async getAddress(): Promise<BigInt> {
        if (!this.address) {
            const result = await this.convex.query(`(address *registry*)`, QUERY_ACCOUNT_ADDRESS)
            this.address = toAddress(result['value'])
        }
        return this.address
    }
}
