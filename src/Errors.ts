/*



    ConvexAPI Errors

*/

class ConvexAPIBaseError extends Error {
    readonly source: string
    readonly code: string
    readonly text: string
    constructor(source: string, code: string, text: string, name: string) {
        const message = `${source}: ${code} ${text}`
        super(message)
        this.source = source
        this.code = code
        this.text = text
        this.name = name
    }
}


export class ConvexAPIError extends ConvexAPIBaseError {
    constructor(source: string, code: string, text: string) {
        super(source, code, text, 'ConvexAPIError')
    }
}

export class ConvexAPIRequestError extends ConvexAPIBaseError {
    constructor(source: string, code: string, text: string) {
        super(source, code, text, 'ConvexAPIRequestError')
    }
}