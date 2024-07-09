import React, { useState, useEffect } from "react";
import Web3 from "web3";
import detectEthereumProvider from "@metamask/detect-provider";
import SimpleStorage from "./contracts/SimpleStorage.json";

function App() {
  const [storageValue, setStorageValue] = useState(0);
  const [web3, setWeb3] = useState(null);
  const [accounts, setAccounts] = useState(null);
  const [contract, setContract] = useState(null);

  useEffect(() => {
    const init = async () => {
      // Detect the Ethereum provider
      const provider = await detectEthereumProvider();

      if (provider) {
        // Create a new Web3 instance with the provider
        const web3Instance = new Web3(provider);
        setWeb3(web3Instance);

        try {
          // Request accounts from the provider
          const accounts = await provider.request({ method: 'eth_requestAccounts' });
          setAccounts(accounts);

          // Get the network ID
          const networkId = await web3Instance.eth.net.getId();
          const deployedNetwork = SimpleStorage.networks[networkId];
          if (deployedNetwork) {
            // Create a new contract instance
            const instance = new web3Instance.eth.Contract(
              SimpleStorage.abi,
              deployedNetwork && deployedNetwork.address
            );
            console.log("abi : ", SimpleStorage.abi);
            console.log("deployedNetwork [addr]: ", deployedNetwork.address);
            setContract(instance);

            // Get the initial value from the smart contract
            const response = await instance.methods.get().call();
            console.log("response", response);
            setStorageValue(response);
          } else {
            console.error("Smart contract not deployed to detected network.");
          }
        } catch (error) {
          console.error("Could not connect to contract or chain: ", error);
        }
      } else {
        console.error("Please install MetaMask!");
      }
    };

    init();
  }, []);

  const handleSet = async () => {
    if (contract) {
      console.log("storage: ", storageValue);
      await contract.methods.set(storageValue).send({ from: accounts[0] });
      const response = await contract.methods.get().call();
      setStorageValue(response);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Simple Storage DApp</h1>
        <p>
          The stored value is: {storageValue}
        </p>
        <input
          type="number"
          value={storageValue}
          onChange={(e) => setStorageValue(e.target.value)}
        />
        <button onClick={handleSet}>Set Value</button>
      </header>
    </div>
  );
}

export default App;
