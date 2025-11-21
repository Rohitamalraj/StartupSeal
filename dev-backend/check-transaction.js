const { SuiClient } = require('@mysten/sui/client');

const suiClient = new SuiClient({
  url: 'https://fullnode.testnet.sui.io:443'
});

async function checkTransaction() {
  try {
    const txId = 'BfF9zHoxGBMPahwijWGCvh1u9LEwEF48GqUtMW8wKxeY';
    console.log('🔍 Checking transaction:', txId);
    
    const tx = await suiClient.getTransactionBlock({
      digest: txId,
      options: {
        showEvents: true,
        showObjectChanges: true,
        showEffects: true,
        showInput: true
      }
    });

    console.log('\n📊 Transaction Details:');
    console.log('Status:', tx.effects?.status?.status);
    
    console.log('\n🎯 Events Emitted:');
    if (tx.events && tx.events.length > 0) {
      tx.events.forEach((event, i) => {
        console.log(`\nEvent ${i + 1}:`);
        console.log('  Type:', event.type);
        console.log('  Data:', JSON.stringify(event.parsedJson, null, 2));
      });
    } else {
      console.log('  ❌ No events emitted');
    }

    console.log('\n📦 Objects Created:');
    if (tx.objectChanges) {
      tx.objectChanges.forEach((change, i) => {
        if (change.type === 'created') {
          console.log(`\nObject ${i + 1}:`);
          console.log('  ID:', change.objectId);
          console.log('  Type:', change.objectType);
          console.log('  Owner:', change.owner);
        }
      });
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkTransaction();
