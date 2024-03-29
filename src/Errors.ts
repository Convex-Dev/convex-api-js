/*



    Convex Errors

*/

class APIBaseError extends Error {
    readonly source: string
    readonly code: number
    readonly text: string
    constructor(source: string, code: number, text: string, name: string) {
        const message = `${source}: ${code} ${text}`
        super(message)
        this.source = source
        this.code = code
        this.text = text
        this.name = name
    }
}

export class APIError extends APIBaseError {
    constructor(source: string, code: number, text: string) {
        super(source, code, text, 'ConvexAPIError')
    }
}

export class APIRequestError extends APIBaseError {
    constructor(source: string, code: number, text: string) {
        super(source, code, text, 'ConvexAPIRequestError')
    }
}
