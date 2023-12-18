require('@nomicfoundation/hardhat-toolbox')
require('dotenv').config()

module.exports = {
  solidity: '0.8.17',
  networks: {
    sepolia: {
      url: process.env.NETWORK_URL,
      accounts: [process.env.PRIVATE_KEY]
    }
  }
}
