
# convex-api-js

API toolkit to access convex network.

[Documentation](https://convex-dev.github.io/convex-api-js)

## Example of using the library

First import the library and setup the convex API connection

```js
    import { API, Account, KeyPair } from '@convex-dev/convex-api-js'

    const convex = API.create('https://convex.world')
```

Create a new account with some a random key pair.

```js
    const keyPair = KeyPair.create()
    const account = convex.createAccount(keyPair)
```

Topup account to have sufficient funds.

```js
    const amount = await convex.topupAccount(account)
    console.log(`topup account with ${amount} funds.`)
```

Check the balance on the new account.

```js
    const balance = await convex.getBalance(account)
    console.log(`The account ${account.address} has a balance of ${balance}`)

```

Do a send, this will cost the account a small fee so we need the account object to sign the transaction.

```js
    const resultSend = await convex.send('(map inc [1 2 3 4 5])', account)
    consol.log(`Result from calculation ${resultSend}`)
```

All queries are free so we can provide the account object or just an account address, to make the query from.

This can be usefull if you whish to query an actors state by using the actors address as the query address.

```js
    const resultQuery = await convex.query('(balance *address*)', account.address)
    consol.log(`Result from a query ${resultQuery}`)
```

## Example using an key pairs with an account name

We have already saved an existing account keys in a .pem file
So first we need to import the account details public/private keys using it's encrypted data on file

```js
    importKeyPair = keyPair.importFromFile('my-account.pem', 'secret')
```

Create a new account address for the first time, or if the account name has already been regisetered
then load in the account address.

The returned account object will have the account address assigned to the account name `my-account`.

```js
    const account = await convex.setupAccount('my-account', importKeyPair)
```

Later on you may need to re-load the same account address using only the registered name.

```js
    const sameAccount = await convex.loadAccount('my-account', importKeyPair)
```

You can still use `setupAccount` this will just call `loadAccount` if the account name is registered with the registry.

```js
    // or the same as
    const sameAccount = await convex.setupAccount('my-account', importKeyPair)
```


If you just want to find out a name from the registry you can just do this:

```js
    const accountAddress = await convex.resolveAccountName('my-account')
```

## Building and testing this library

To build and test this library. First you need to clone the repositry

```
    git clone https://github.com/Convex-Dev/convex-api-js.git
```

Then you need to install the node.js dependent packages to run with this library:

```
    npm install
```

Now you can run the test suite, by typing the following command:

```
    npm run test
```

After editing any of the source code, you run the lint analyzer to make sure your code is complient:

```
    npm run lint
```
