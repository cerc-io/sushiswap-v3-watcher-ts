# sushiswap-v3-watcher-ts

## Source

* Subgraph: [sushiswap-subgraphs v0.1.0-watcher](https://github.com/cerc-io/sushiswap-subgraphs/releases/tag/v0.1.0-watcher)
  * Package: [subgraphs/v3](https://github.com/cerc-io/sushiswap-subgraphs/tree/release-v0.1.0-watcher/subgraphs/v3)

## Setup

* Run the following command to install required packages:

  ```bash
  yarn
  ```

* Run build:

  ```bash
  yarn build
  ```

* Create a postgres12 database for the watcher:

  ```bash
  sudo su - postgres
  createdb sushiswap-v3-watcher-ts
  ```

* If the watcher is an `active` watcher:

  Create database for the job queue and enable the `pgcrypto` extension on them (https://github.com/timgit/pg-boss/blob/master/docs/usage.md#intro):

  ```
  createdb sushiswap-v3-watcher-ts-job-queue
  ```

  ```
  postgres@tesla:~$ psql -U postgres -h localhost sushiswap-v3-watcher-ts-job-queue
  Password for user postgres:
  psql (12.7 (Ubuntu 12.7-1.pgdg18.04+1))
  SSL connection (protocol: TLSv1.3, cipher: TLS_AES_256_GCM_SHA384, bits: 256, compression: off)
  Type "help" for help.

  sushiswap-v3-watcher-ts-job-queue=# CREATE EXTENSION pgcrypto;
  CREATE EXTENSION
  sushiswap-v3-watcher-ts-job-queue=# exit
  ```

* In the [config file](./environments/local.toml):

  * Update the database connection settings.

  * Update the `upstream` config and provide the `ipld-eth-server` GQL API endpoint.

  * Update the `server` config with state checkpoint settings.

## Customize

* Indexing on an event:

  * Edit the custom hook function `handleEvent` (triggered on an event) in [hooks.ts](./src/hooks.ts) to perform corresponding indexing using the `Indexer` object.

  * While using the indexer storage methods for indexing, pass `diff` as true if default state is desired to be generated using the state variables being indexed.

* Generating state:

  * Edit the custom hook function `createInitialState` (triggered if the watcher passes the start block, checkpoint: `true`) in [hooks.ts](./src/hooks.ts) to save an initial `State` using the `Indexer` object.

  * Edit the custom hook function `createStateDiff` (triggered on a block) in [hooks.ts](./src/hooks.ts) to save the state in a `diff` `State` using the `Indexer` object. The default state (if exists) is updated.

  * Edit the custom hook function `createStateCheckpoint` (triggered just before default and CLI checkpoint) in [hooks.ts](./src/hooks.ts) to save the state in a `checkpoint` `State` using the `Indexer` object.

### GQL Caching

To enable GQL requests caching:

* Update the `server.gql.cache` config with required settings.

* In the GQL [schema file](./src/schema.gql), use the `cacheControl` directive to apply cache hints at schema level.

  * Eg. Set `inheritMaxAge` to true for non-scalar fields of a type.

* In the GQL [resolvers file](./src/resolvers.ts), uncomment the `setGQLCacheHints()` calls in resolvers for required queries.

## Run

* If the watcher is a `lazy` watcher:

  * Run the server:

    ```bash
    yarn server
    ```

    GQL console: http://localhost:3008/graphql

* If the watcher is an `active` watcher:

  * Run the job-runner:

    ```bash
    yarn job-runner
    ```

  * Run the server:

    ```bash
    yarn server
    ```

    GQL console: http://localhost:3008/graphql

  * To watch a contract:

    ```bash
    yarn watch:contract --address <contract-address> --kind <contract-kind> --checkpoint <true | false> --starting-block [block-number]
    ```

    * `address`: Address or identifier of the contract to be watched.
    * `kind`: Kind of the contract.
    * `checkpoint`: Turn checkpointing on (`true` | `false`).
    * `starting-block`: Starting block for the contract (default: `1`).

    Examples:

    Watch a contract with its address and checkpointing on:

    ```bash
    yarn watch:contract --address 0x1F78641644feB8b64642e833cE4AFE93DD6e7833 --kind ERC20 --checkpoint true
    ```

    Watch a contract with its identifier and checkpointing on:

    ```bash
    yarn watch:contract --address MyProtocol --kind protocol --checkpoint true
    ```

  * To fill a block range:

    ```bash
    yarn fill --start-block <from-block> --end-block <to-block>
    ```

    * `start-block`: Block number to start filling from.
    * `end-block`: Block number till which to fill.

  * To create a checkpoint for a contract:

    ```bash
    yarn checkpoint create --address <contract-address> --block-hash [block-hash]
    ```

    * `address`: Address or identifier of the contract for which to create a checkpoint.
    * `block-hash`: Hash of a block (in the pruned region) at which to create the checkpoint (default: latest canonical block hash).

  * To verify a checkpoint:

    ```bash
    yarn checkpoint verify --cid <checkpoint-cid>
    ```

    `cid`: CID of the checkpoint for which to verify.

  * To reset the watcher to a previous block number:

    * Reset watcher:

      ```bash
      yarn reset watcher --block-number <previous-block-number>
      ```

    * Reset job-queue:

      ```bash
      yarn reset job-queue
      ```

    * Reset state:

      ```bash
      yarn reset state --block-number <previous-block-number>
      ```

    * `block-number`: Block number to which to reset the watcher.

  * To export and import the watcher state:

    * In source watcher, export watcher state:

      ```bash
      yarn export-state --export-file [export-file-path] --block-number [snapshot-block-height]
      ```

      * `export-file`: Path of file to which to export the watcher data.
      * `block-number`: Block height at which to take snapshot for export.

    * In target watcher, run job-runner:

      ```bash
      yarn job-runner
      ```

    * Import watcher state:

      ```bash
      yarn import-state --import-file <import-file-path>
      ```

      * `import-file`: Path of file from which to import the watcher data.

    * Run server:

      ```bash
      yarn server
      ```

  * To inspect a CID:

    ```bash
    yarn inspect-cid --cid <cid>
    ```

    * `cid`: CID to be inspected.
