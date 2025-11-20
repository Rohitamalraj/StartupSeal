import { Transaction } from '@mysten/sui/transactions';
import { bcs } from '@mysten/sui/bcs';

const PACKAGE_ID = '0xe1df86bc99868f214f86951db2738bd2c46c47f2a4db6753f4fb98f681bef015';
const SEAL_REGISTRY = '0xbf8c46c6ded3db79361e84b12ab98e4957fc5cf345e7f43bd466e9775bbda01d';

const tx = new Transaction();

// Test data
const nameBytes = Array.from(new TextEncoder().encode('Eth'));
const repoBytes = Array.from(new TextEncoder().encode('AZAR2305/eth'));
const hackathonBytes = Array.from(new TextEncoder().encode('ETHGlobal 2024'));
const documentHashBytes = Array.from(new TextEncoder().encode('loan lending'));

// Empty blob IDs
const blobIdVectors = [];
const blobIdArg = tx.pure(bcs.vector(bcs.vector(bcs.U8)).serialize(blobIdVectors));

// Scores
const hackathonScore = 70;
const githubScore = 50;
const aiScore = 75;
const documentScore = 50;

// Nonce and submission hash
const nonce = Date.now();
const submissionHash = `Eth-AZAR2305/eth-ETHGlobal 2024-${nonce}`;
const submissionHashBytes = new TextEncoder().encode(submissionHash);

console.log('Building transaction with:');
console.log('Name:', nameBytes);
console.log('Repo:', repoBytes);
console.log('Hackathon:', hackathonBytes);
console.log('Blob IDs:', blobIdVectors);
console.log('Document:', documentHashBytes);
console.log('Scores:', { hackathonScore, githubScore, aiScore, documentScore });
console.log('Nonce:', nonce);
console.log('Submission hash:', submissionHash);

tx.moveCall({
  target: `${PACKAGE_ID}::startup_seal::mint_startup_seal`,
  arguments: [
    tx.object(SEAL_REGISTRY),
    tx.pure.vector('u8', nameBytes),
    tx.pure.vector('u8', repoBytes),
    tx.pure.vector('u8', hackathonBytes),
    blobIdArg,
    tx.pure.vector('u8', documentHashBytes),
    tx.pure.u64(hackathonScore),
    tx.pure.u64(githubScore),
    tx.pure.u64(aiScore),
    tx.pure.u64(documentScore),
    tx.pure.u64(nonce),
    tx.pure.vector('u8', Array.from(submissionHashBytes)),
    tx.object('0x6')
  ]
});

console.log('\nTransaction built successfully!');
console.log('Transaction JSON:', JSON.stringify(tx, null, 2));
