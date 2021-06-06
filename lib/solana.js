import BN from "bn.js";
import { AccountLayout, Token, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { Account, Connection, PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY, Transaction, TransactionInstruction } from "@solana/web3.js";
import Wallet from "@project-serum/sol-wallet-adapter";
import { STATE_ACCT_DATA_LAYOUT } from "./layout";

const REV_SHARING_PROGRAM_ID = process.env.NEXT_PUBLIC_REV_SHARING_PROGRAM_ID;
const TOKEN_MINT_ACCT = process.env.NEXT_PUBLIC_TOKEN_MINT_ACCT;
const WALLET_PROVIDER = process.env.NEXT_PUBLIC_WALLET_PROVIDER;
const connection = new Connection(process.env.NEXT_PUBLIC_CONNECT_URL, "singleGossip");
let wallet;

async function connectWallet() {
  if (!wallet) {
    wallet = new Wallet(WALLET_PROVIDER);
    wallet.on("connect", (publicKey) => console.log("Wallet connected to " + publicKey.toBase58()));
    wallet.on("disconnect", () => console.log("Wallet disconnected"));
    await wallet.connect();
  }
}

function adjustAmount(amount) {
  return Math.round(parseFloat(amount) * 100);
}

export const fetchRevenueSharingData = async (stateAcct, sharedAcct) => {
  // Get state account data
  const stateAcctPubkey = new PublicKey(stateAcct);
  const stateAcctInfo = await connection.getAccountInfo(stateAcctPubkey, "singleGossip");
  const stateAcctData = STATE_ACCT_DATA_LAYOUT.decode(stateAcctInfo.data);

  // Get shared account data
  const tokenMintPubKey = new PublicKey(TOKEN_MINT_ACCT);
  const token = new Token(connection, tokenMintPubKey, TOKEN_PROGRAM_ID, null);
  const sharedAcctPubKey = new PublicKey(sharedAcct);
  const tokenAccountInfo = await token.getAccountInfo(sharedAcctPubKey);
  const sharedAcctBalance = tokenAccountInfo.amount.toNumber() / 100;

  return {
    isInitialized: !!stateAcctData.isInitialized,
    member1Acct: new PublicKey(stateAcctData.member1Acct).toBase58(),
    member2Acct: new PublicKey(stateAcctData.member2Acct).toBase58(),
    member1Shares: stateAcctData.member1Shares / 100,
    member2Shares: stateAcctData.member2Shares / 100,
    member1Withdraw: new BN(stateAcctData.member1Withdraw, 10, "le").toNumber(),
    member2Withdraw: new BN(stateAcctData.member2Withdraw, 10, "le").toNumber(),
    sharedAcctBalance,
  };
};

export const initRevenueSharing = async (member1Acct, member2Acct, member1Shares, member2Shares) => {
    await connectWallet();

    // Get public key of member accounts
    const member1AcctPubKey = new PublicKey(member1Acct);
    const member2AcctPubKey = new PublicKey(member2Acct);
    
    // Adjust value of shares
    member1Shares = Math.round(member1Shares * 100);
    member2Shares = Math.round(member2Shares * 100);

    // TODO check if member 1 and member 2 accounts are from the same mint account. This will prevent failures due to cross-token transfers

    // Get account of initilizer
    const initAcctPubKey = wallet.publicKey;
    // TODO remove this code: hard-coded trowaway account!
    const privateKeyByteArray = '204,247,141,179,226,164,207,168,8,98,198,245,247,12,156,14,52,80,215,199,7,51,90,173,174,95,124,223,249,143,75,173,98,3,244,11,214,38,174,24,6,137,162,194,26,0,252,78,72,147,100,38,75,96,137,212,12,72,194,18,150,100,113,98';
    const privateKeyDecoded = privateKeyByteArray.split(',').map(s => parseInt(s));
    const initializerAccount = new Account(privateKeyDecoded);
        
    // Create shared account instruction
    const sharedAcct = new Account();
    const sharedAcctPubKey = sharedAcct.publicKey;
    const sharedAcctLamports = await connection.getMinimumBalanceForRentExemption(AccountLayout.span, 'singleGossip');
    const createSharedAcctIx = SystemProgram.createAccount({
        fromPubkey: initAcctPubKey,         // The account that will transfer lamports to the created account
        lamports: sharedAcctLamports,       // Amount of lamports to transfer to the created account
        newAccountPubkey: sharedAcctPubKey, // Public key of the created account
        programId: TOKEN_PROGRAM_ID,        // Public key of the program to assign as the owner of the created account
        space: AccountLayout.span,          // Amount of space in bytes to allocate to the created account
    });
    
    // Initialize shared account instruction
    const tokenMintAcctPubKey = new PublicKey(TOKEN_MINT_ACCT);
    const initSharedAcctIx = Token.createInitAccountInstruction(
        TOKEN_PROGRAM_ID,       // SPL Token program account
        tokenMintAcctPubKey,    // Token mint account
        sharedAcctPubKey,       // New account
        initAcctPubKey,         // Owner of the new account (shared account)
    );
    
    // Create state account instruction
    const stateAcct = new Account();
    const stateAcctPubKey = stateAcct.publicKey;
    const revSharingProgramPubKey = new PublicKey(REV_SHARING_PROGRAM_ID);
    const stateAcctLamports = await connection.getMinimumBalanceForRentExemption(STATE_ACCT_DATA_LAYOUT.span, 'singleGossip')
    const createStateAcctIx = SystemProgram.createAccount({
        fromPubkey: initAcctPubKey,
        lamports: stateAcctLamports,
        newAccountPubkey: stateAcctPubKey,
        programId: revSharingProgramPubKey,
        space: STATE_ACCT_DATA_LAYOUT.span,
    });

    // Initialize revenue sharing instruction
    const initRevSharingIx = new TransactionInstruction({
        programId: revSharingProgramPubKey,
        keys: [
            { pubkey: initAcctPubKey, isSigner: true, isWritable: false },
            { pubkey: sharedAcctPubKey, isSigner: false, isWritable: true },
            { pubkey: stateAcctPubKey, isSigner: false, isWritable: true },
            { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false},
            { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
            { pubkey: member1AcctPubKey, isSigner: false, isWritable: false },
            { pubkey: member2AcctPubKey, isSigner: false, isWritable: false },
        ],
        data: Buffer.from(Uint8Array.of(0, // Instruction
            ...new BN(member1Shares).toArray("le", 2), // Member 1 shares
            ...new BN(member2Shares).toArray("le", 2), // Member 2 shares
        )),
    })

    // Create the transaction with all instructions to be submitted
    const tx = new Transaction().add(
        createSharedAcctIx, 
        initSharedAcctIx,
        createStateAcctIx,
        initRevSharingIx
    );
    
    // TODO: Fix this code to allow member sign the transaction using the wallet

    // Get recent block hash
    let { blockhash } = await connection.getRecentBlockhash();
    tx.recentBlockhash = blockhash;
    tx.feePayer = initAcctPubKey;
            
    // Sign transaction
    let signedTx = await wallet.signTransaction(tx);

    // Send transaction and wait confirmation
    let txId = await connection.sendRawTransaction(signedTx.serialize(), { 
      skipPreflight: false, 
      preflightCommitment: 'confirmed'
    });

    await connection.confirmTransaction(txId);
    
    /*
    // Send the transaction 
    // This code works and it uses a hard coded private key for initializerAccount
    // The other two writable accounts (sharedAcct and stateAcct also 'sign' the 
    // transaction 
    // 
    const txId = await connection.sendTransaction(tx, 
      [ initializerAccount, sharedAcct, stateAcct],
      { skipPreflight: false, preflightCommitment: 'singleGossip'}
    );

    // Wait
    await new Promise((resolve) => setTimeout(resolve, 2000));
    */

    // Get account state acct data
    const stateAcctInfo = await connection.getAccountInfo(stateAcctPubKey, 'singleGossip');
    const stateAccData = STATE_ACCT_DATA_LAYOUT.decode(stateAcctInfo.data);

    return {
        isInitialized: !!stateAccData.isInitialized,
        initAcct: initAcctPubKey.toBase58(),
        stateAcct: stateAcctPubKey.toBase58(),
        sharedAcct: sharedAcctPubKey.toBase58(),
        member1Acct: new PublicKey(stateAccData.member1Acct).toBase58(),
        member1Shares: new BN(stateAccData.member1Shares, 10, "le").toNumber(),
        member2Acct: new PublicKey(stateAccData.member2Acct).toBase58(),
        member2Shares: new BN(stateAccData.member2Shares, 10, "le").toNumber()
    };
}

export const withdraw = async (stateAcct, sharedAcct, withdrawAmount, withdrawAcct) => {
  try {
    withdrawAmount = adjustAmount(withdrawAmount);
    wallet = await connectWallet();

    // 0. Initializer account
    const initAcctPubKey = wallet.publicKey;
    console.log("initAcctPubKey", initAcctPubKey);

    // 1. State account
    const stateAcctPubKey = new PublicKey(stateAcct);
    console.log("stateAcctPubKey", stateAcctPubKey);

    // 2. Shared account
    const sharedAcctPubKey = new PublicKey(sharedAcct);
    console.log("sharedAcctPubKey", sharedAcctPubKey);

    // 3. Withdraw account
    const withdrawAcctPubKey = new PublicKey(withdrawAcct);
    console.log("withdrawAcctPubKey", withdrawAcctPubKey);

    // 4. Token program account => TOKEN_PROGRAM_ID

    // 5. PDA account
    const programId = new PublicKey(REV_SHARING_PROGRAM_ID);
    const pdaAcctPubKey = await PublicKey.findProgramAddress(
      [Buffer.from("revenue_sharing")],
      programId
    );
    console.log("programId", programId);
    console.log("pdaAcctPubKey", pdaAcctPubKey[0]);

    // Withdraw instruction
    const withdrawIx = new TransactionInstruction({
      programId,
      data: Buffer.from(Uint8Array.of(1, ...new BN(withdrawAmount).toArray("le", 8))),
      keys: [
        { pubkey: initAcctPubKey, isSigner: true, isWritable: false },
        { pubkey: stateAcctPubKey, isSigner: false, isWritable: true },
        { pubkey: sharedAcctPubKey, isSigner: false, isWritable: true },
        { pubkey: withdrawAcctPubKey, isSigner: false, isWritable: true },
        { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
        { pubkey: pdaAcctPubKey[0], isSigner: false, isWritable: false },
      ],
    });
    console.log("withdrawIx", withdrawIx);

    // Get recent block hash
    let { blockhash } = await connection.getRecentBlockhash();

    // Transaction
    const tx = new Transaction().add(withdrawIx);
    tx.recentBlockhash = blockhash;
    tx.feePayer = wallet.publicKey;
    let signedTx = await wallet.signTransaction(tx);

    let txId = await connection.sendRawTransaction(signedTx.serialize());
    await connection.confirmTransaction(txId);

    return txid;
  } catch (err) {
    console.log(err);
    throw err;
  }
};
