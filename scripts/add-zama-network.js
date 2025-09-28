// Script to add Zama Testnet to MetaMask
// Copy and paste this into your browser console while on the tutorial page

async function addZamaTestnet() {
  try {
    await window.ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [{
        chainId: '0x1f49', // 8009 in hex
        chainName: 'Zama Testnet',
        rpcUrls: ['https://devnet.zama.ai'],
        nativeCurrency: {
          name: 'Zama',
          symbol: 'ZAMA',
          decimals: 18,
        },
        blockExplorerUrls: ['https://explorer.zama.ai'],
      }],
    });
    console.log('✅ Zama Testnet added successfully!');
  } catch (error) {
    console.error('❌ Failed to add Zama Testnet:', error);
  }
}

// Run the function
addZamaTestnet();
