## Description

Integration service using to handle orders between Partner API and OP API

## Installation

```bash
$ npm install
```

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Migration and Seeding
```bash
# format code in prisma/schema.prisma
$ npx prisma format

# generate @prisma/client data
$ npx prisma generate

# generate migration based on schema
$ npx prisma migrate dev --name init

# run seeding
$ npx prisma db seed
```


### Development

[Local Playground GraphQl](http://localhost:3000/graphql)
