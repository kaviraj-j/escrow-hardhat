import { ethers } from 'ethers'
import { useState, useEffect } from 'react'
import { createEscrow, getListEscrows, approveEscrow, getListEscrowsToApprove } from './actions'
import Escrow from './Escrow'
import contractAddresses from "./contractAddresses.json"

function App () {
  const [escrows, setEscrows] = useState([])
  const [escrowsToApprove, setEscrowsToApprove] = useState([])
  const [account, setAccount] = useState()
  const [balance, setBalance] = useState(0)
  const [isCorrectNetwork, setIsCorrectNetwork] = useState(false)
  const [signer, setSigner] = useState()
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('')
  const [contractAddress, setContractAddress] = useState('')

  const networkNames = Object.keys(contractAddresses).map(key => {
    const obj = contractAddresses[key];
    return <span key={key}>{obj.name}, </span>;
  });

  useEffect(() => {
    console.log("Contract address updated: " + contractAddress);
  }, [contractAddress]);

  useEffect(() => {
    console.log("Signer updated: " + signer);
  }, [signer]);

  async function connectWallet () {
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    await provider.send('eth_requestAccounts', [])

    const signerAccount = await provider.getSigner()
    
    setSigner(signerAccount)
    setAccount(await signer.getAddress())
    setBalance(ethers.utils.formatEther(await signer.getBalance()))

    // Check if you are on the right network
    // Localhost = 31337
    // sepolia = 11155111
    const networkId = await provider.getNetwork()
    if (contractAddresses.hasOwnProperty(networkId.chainId)) {
      console.log("Correct Network!!")
      setContractAddress(contractAddresses[networkId.chainId].contractAddress)
      setIsCorrectNetwork(true)

      // Get list personal escrows
      const escrowsList = await getListEscrows(signer, contractAddress)
    setEscrows(escrowsList)

    const escrowsListToApprove = await getListEscrowsToApprove(signer, contractAddress)
    setEscrowsToApprove(escrowsListToApprove)      

    }
  }

  async function approve (escrowId, signer) {
    try {
      const tx = await approveEscrow(signer, contractAddress, escrowId)
      await tx.wait()
      return {
        message: 'Contract approved',
        type: 'success'
      }
    } catch (err) {
      return {
        message: err.message.includes('Only the arbiter can approve it') ? 'Only the arbiter can approve it' : 'Error during approvation',
        type: 'error'
      }
    }
  }

  async function newContract () {
    const beneficiary = document.getElementById('beneficiary').value
    const arbiter = document.getElementById('arbiter').value
    const value = ethers.utils.parseEther(document.getElementById('wei').value, 'ether')

    try {
      const tx = await createEscrow(signer, contractAddress, arbiter, beneficiary, value)
      await tx.wait()
      setMessage('Contract created')
      setMessageType('success')
    } catch (err) {
      console.log('err new contract', err)
      setMessage('Error during creation of new contract')
      setMessageType('error')
    }

    // Reload list of personal escrows and escrows to approve
    const escrowsList = await getListEscrows(signer, contractAddress)
    setEscrows(escrowsList)

    const escrowsListToApprove = await getListEscrowsToApprove(signer, contractAddress)
    setEscrowsToApprove(escrowsListToApprove)
  }

  return (
    <div>
      <h1 className='text-center font-bold mt-4 text-2xl'>Escrow dApp</h1>
      
      <div className='block p-6 rounded-lg shadow-lg bg-white mx-auto my-4 max-w-md'>
        {!account
          ? (
            <button
              className='w-full px-6 py-2 bg-blue-600 text-white font-medium text-xs leading-tight uppercase rounded shadow-md hover:bg-blue-700 hover:shadow-lg focus:bg-blue-700 focus:shadow-lg focus:outline-none focus:ring-0 active:bg-blue-800 active:shadow-lg'
              id='deploy'
              onClick={connectWallet}
            >
              Connect your wallet
            </button>
            )
          : (
            <div className='contract'>
              <h2 className='text-xl font-bold mb-6'>Create New Contract</h2>

              <div className='form-control mb-4'>
                <label htmlFor='your_account' className='font-bold'>Your account</label>
                <input
                  className='border border-solid border-gray-300 rounded bg-white bg-clip-padding text-base font-normal w-full px-3 py-1' type='text' id='your_account' disabled value={account}
                />
              </div>

              <div className='form-control mb-4'>
                <label htmlFor='your_balance' className='font-bold'>Your balance in ETH</label>
                <input
                  className='border border-solid border-gray-300 rounded bg-white bg-clip-padding text-base font-normal w-full px-3 py-1' type='text' id='your_balance' disabled value={balance}
                />
              </div>

              <div className='form-control mb-4'>
                <label htmlFor='arbiter' className='font-bold'>Arbiter account</label>
                <input
                  className='border border-solid border-gray-300 rounded bg-white bg-clip-padding text-base font-normal w-full px-3 py-1' type='text' id='arbiter'
                />
              </div>

              <div className='form-control mb-4'>
                <label htmlFor='beneficiary' className='font-bold'>Beneficiary account</label>
                <input
                  className='border border-solid border-gray-300 rounded bg-white bg-clip-padding text-base font-normal w-full px-3 py-1' type='text' id='beneficiary'
                />
              </div>

              <div className='form-control mb-4'>
                <label htmlFor='wei' className='font-bold'>Deposit Amount (in ETH)</label>
                <input
                  className='border border-solid border-gray-300 rounded bg-white bg-clip-padding text-base font-normal w-full px-3 py-1' type='number' step='0.01' id='wei'
                />
              </div>

              {!isCorrectNetwork && (
                <p className='text-red-400 text-center font-xs mb-8'>
                      Warning: you are on the wrong network, switch to any one of these networks - [ {networkNames} ] and reload the page!
                </p>
              )}
              <button
                className='w-full px-6 py-2 bg-blue-600 text-white font-medium text-xs leading-tight uppercase rounded shadow-md hover:bg-blue-700 hover:shadow-lg focus:bg-blue-700 focus:shadow-lg focus:outline-none focus:ring-0 active:bg-blue-800 active:shadow-lg'
                id='deploy'
                onClick={(e) => {
                  e.preventDefault()

                  newContract()
                }}
              >
                Deploy
              </button>
              {message !== '' &&
                (
                  <p className={`px-4 py-2 mt-4 font-bold rounded-sm text-white ${messageType === 'success' ? 'bg-green-800' : 'bg-red-800'}`}>{message}</p>
                )}
            </div>
            )}
      </div>
      {escrows.length > 0 &&
        (
          <div className='block p-6 mx-auto my-4 w-full'>
            <h1 className='text-center font-bold text-xl'>Your Existing Contracts</h1>

            <div className='mt-4 lg:grid lg:grid-cols-2 lg:gap-4'>
              {escrows.map((escrow) => {
                escrow.approveFunction = () => { return approve(escrow.id.toString(), signer) }
                return <Escrow key={escrow.id.toString()} {...escrow} />
              })}
            </div>
          </div>
        )}

      {escrowsToApprove.length > 0 &&
      (
        <div className='block p-6 mx-auto my-4 w-full'>
          <h1 className='text-center font-bold text-xl'>Existing Contracts To Approve</h1>

          <div className='mt-4 lg:grid lg:grid-cols-2 lg:gap-4'>
            {escrowsToApprove.map((escrow) => {
              escrow.approveFunction = () => { return approve(escrow.id.toString(), signer) }
              return <Escrow key={escrow.id.toString()} {...escrow} />
            })}
          </div>
        </div>
      )}

      </div>
  )
}

export default App
