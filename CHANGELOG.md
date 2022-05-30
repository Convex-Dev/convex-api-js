# Change Log

## Release 0.2.12
+   Export new util functions

## Release 0.2.11
+   can import/export private key from openssl standard encrypted base64 format
+   At the moment PEM PKCS8 format not supported
+   utils function 'hexToByteArray', 'isHexString', 'wordArrayToByteArray' and 'byteArrayToWordArray' to support the new crypto library

## Release 0.2.10
+   removed cypto, pem-file packages and replaced with @noble/ed25519 and crypto-key-composer

## Release v0.2.9
+   change import of the fs module to be dynamic for client apps

## Release v0.2.8
+   move to cross-fetch

## Release v0.2.7
+   utils isAccount function, to test if the address number/string/Account is an account object
+   API.setupAccount only calls API.autoTopup if the owner account is not provided
+   Minor bug fixes and cleanup

## Release v0.2.6
+   more export of utils
+   export Registry class, and access via API object
+   Code cleanup and more testing

## Release v0.2.5
+   Export utils module
+   process Account object for toAddress utility

### Release v0.2.4
+   Package maintenance

### Release v0.2.2
+   Upgrade to use Convex Apha 0.7.0 RC4
+   Remove export statement from contracts
+   Added address prefix char #
+   Converted registry names to symbols

### Release v0.2.1
+   Remove Scrypt language

### Release v0.2.0
+   ******** Breaking changes ********
+   Rename ConvexAccount to Account
+   Rename ConvexAPI to API
+   Split ConvexAccount to KeyPair
+   API class has to use the `create` method to create a new object

### Relase 0.1.3
+   Add address '#' identifier before each address number.

### Release 0.1.2
+   same as 0.1.1

### Release 0.1.1
+   Add Registry class to register and resolve account names

### Release 0.1.0
+   Create an account using ConvexAPI class

### Release 0.0.8
+   Rename Account createNew to create

### Release 0.0.6, 0.0.7
+   Absolute paths on import of modules

### Release 0.0.5
+   Better build/publish method using `npm run release`

### Release 0.0.4
+   Rename Account to ConvexAccount

### Release 0.0.3
+   index.ts for library packages

### Release 0.0.2
+   Better workflows
+   Run tests with address returned with no leading 0x
+   Make into a package library

### Release 0.0.1
+   initial pre-release

