/*

    Interface IAccountInformation
*/

export interface IAccountInformation {
    address: BigInt
    isLibrary: boolean
    isActor: boolean
    memorySize: number
    allowance: number
    type: string
    balance: number
    sequence: number
    environment: unknown
}
