bridge erc20
---

### 1、introduce
```
erc20 token to bridge on different chains
```
### 2、require
```
yarn
```

### 3、setting .env
```
BSC_TEST_URL=http://103.23.44.17:18575
COQ_URL=https://testnet.ankr.com
BSC_MAIN_URL=https://rpc.ankr.com/bsc
APE_MAIN_URL=https://bas.metaapesgame.com/bas_mainnet_full_rpc
PRIVATE_KEY=???

```

### 4、deploy
#### 4.1 testnet 
```
npx hardhat run scripts/bsctest/deploy.ts --network bsctest
npx hardhat run scripts/coq/deploy.ts --network coq
```

### 4.2 peel
```
npx hardhat run scripts/peel/deploy-ape.ts --network ape
npx hardhat run scripts/peel/deploy-bsc.ts --network bsc
```