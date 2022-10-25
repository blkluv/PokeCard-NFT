import { Injectable } from '@angular/core';
import Web3 from 'web3';
import * as contract from '../../../../artifacts/contracts/MyNFT.sol/NFTMarketplace.json';
import { AbiItem } from 'web3-utils';
import { ContractInfo } from '../models/contract-info';
import { resolve } from 'dns';
import { environment } from 'src/environments/environment';
import { any, json } from 'hardhat/internal/core/params/argumentTypes';

@Injectable({
  providedIn: 'root',
})
export class WalletService {
  constructor() { }

  web3: any = new Web3(window.ethereum);
  walletAddress: string = '';
  contractInfo: ContractInfo = {
    contractAddress: environment.contractAddress,
    contractABI: contract.abi as AbiItem[],
  };
  nftContract = new this.web3.eth.Contract(
    this.contractInfo.contractABI,
    this.contractInfo.contractAddress
  );

  public getNftBalance(): Promise<number> {
    return new Promise((resolve, reject) => {
      this.nftContract.defaultAccount = this.walletAddress;
      this.nftContract.methods
        .balanceOf(this.walletAddress)
        .call(function (err: any, result: any) {
          if (err != null) {
            reject(err);
          }
          console.log('Numero di NFT: ', result);
          resolve(result);
        });
    }) as Promise<number>;
  }
  async getDataFromPinataURI(url: string) {
    url = url.replace(':/', '');
    const getInfo = await fetch(environment.pinataBaseUrl + url, {
      method: 'GET',
    }).then((response: any) => {
      console.log("response: ", response);
      return response.json();
    }).then(function (data) {
      console.log("parsed data:", data);
      return data;
    }).catch(e => console.log("Errore: ", e));
    return getInfo;
  }
  getUsers(): Promise<any[]> {

    for (let baseUrl of environment.ipfsBaseUrlGeteway) { }
    return fetch('/users.json')
      // the JSON body is taken from the response
      .then(res => res.json())
      .then(res => {
        // The response has an `any` type, so we need to cast
        // it to the `User` type, and return it from the promise
        return res
      })
  }

  public async getAllNFTs() {
    //get all the transaction in the contract
    let transaction = await this.nftContract.methods.getAllNFTs().call();
    //Fetch all the details of every NFT from the contract and display
    const items = await Promise.all(transaction.map(async (i: any) => {
      const tokenURI = await this.nftContract.methods.tokenURI(i.tokenId).call();
      const nftData = await this.getDataFromPinataURI(tokenURI);
      console.log({ nftData });
      /*       let meta = await axios.get(tokenURI);
            meta = meta.data;
      
            return item; */
    }))

    //Fetch all the details of every NFT from the contract and display
    /* const items = await Promise.all(transaction.map(async i => {
      const tokenURI = await contract.tokenURI(i.tokenId);
      let meta = await axios.get(tokenURI);
      meta = meta.data;

      let price = ethers.utils.formatUnits(i.price.toString(), 'ether');
      let item = {
        price,
        tokenId: i.tokenId.toNumber(),
        seller: i.seller,
        owner: i.owner,
        image: meta.image,
        name: meta.name,
        description: meta.description,
      }
      return item;
    })) */
  }

  connect(): boolean {
    if (window.ethereum) {
      console.log('Metamask is installed!');
      window.ethereum
        .request({
          method: 'eth_requestAccounts',
        })
        .then((accountsAddress: string) => {
          this.walletAddress = accountsAddress[0];
          console.log(this.walletAddress);
          this.web3 = new Web3(window.ethereum);
          //const accounts = this.web3Instance.eth.getAccounts();

          console.log('Account connected successfully!', this.web3);
          return true;
        })
        .catch(() => {
          console.log('Somethings goes wrong...retry');
          return false;
        });
    } else {
      window.alert(
        'Non-Ethereum browser detected. You Should consider using MetaMask!'
      );
      return false;
    }
    return false;
  }
}
