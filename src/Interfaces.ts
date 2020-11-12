/*
    Interfaces

*/

export interface IConvexAccountInformation {
    address: string
    is_library: boolean
    is_actor: boolean
    memory_size: number
    allowance: number
    type: string
    balance: number
    sequence: number
    environment: unknown
}
