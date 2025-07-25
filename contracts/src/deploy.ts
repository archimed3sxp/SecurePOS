import { Application } from 'lisk-sdk';
import { SecurePOSModule } from './securepos-module';

async function deploySecurePOS() {
  try {
    console.log('🚀 Deploying SecurePOS Smart Contract...');

    // Create Lisk application instance
    const app = Application.defaultApplication({
      genesisBlock: {
        header: {
          timestamp: Date.now(),
          height: 0,
          previousBlockID: Buffer.alloc(32),
          transactionRoot: Buffer.alloc(32),
          generatorPublicKey: Buffer.alloc(32),
          reward: BigInt(0),
          asset: {
            accounts: [
              {
                address: 'lsk24cd35u4jdq8szo4pnsqe5dsxwrnazyqqqg5eu', // Default deployer address
                balance: BigInt('10000000000'), // 100 LSK
              }
            ],
            initDelegates: [],
            initRounds: 3,
          },
          signature: Buffer.alloc(64),
          id: Buffer.alloc(32),
          version: 2,
          maxHeightPreviouslyForged: 0,
          maxHeightPrevoted: 0,
          seedReveal: Buffer.alloc(16),
        },
        payload: [],
      },
      networkIdentifier: Buffer.from('securepos-testnet', 'utf8'),
    });

    // Register SecurePOS module
    const securePOSModule = new SecurePOSModule();
    app.registerModule(securePOSModule);

    console.log('✅ SecurePOS module registered successfully');
    console.log('📋 Contract Details:');
    console.log(`   Module Name: ${securePOSModule.name}`);
    console.log(`   Module ID: ${securePOSModule.id}`);
    console.log('   Available Methods:');
    console.log('   - submitSalesHash (Cashier only)');
    console.log('   - getSalesHash (Public)');
    console.log('   - addUser (Admin only)');
    console.log('   - removeUser (Admin only)');
    console.log('   - hasRole (Public)');
    console.log('   - getAllSalesRecords (Admin only)');
    
    console.log('\n🔐 Default Admin Address: lsk24cd35u4jdq8szo4pnsqe5dsxwrnazyqqqg5eu');
    console.log('💡 Use this address to manage user roles and access admin functions');

    return {
      success: true,
      moduleId: securePOSModule.id,
      moduleName: securePOSModule.name,
      adminAddress: 'lsk24cd35u4jdq8szo4pnsqe5dsxwrnazyqqqg5eu'
    };

  } catch (error) {
    console.error('❌ Deployment failed:', error);
    return { success: false, error: error.message };
  }
}

// Run deployment
if (require.main === module) {
  deploySecurePOS()
    .then((result) => {
      if (result.success) {
        console.log('\n🎉 SecurePOS deployment completed successfully!');
      } else {
        console.error('\n💥 Deployment failed:', result.error);
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('💥 Unexpected error during deployment:', error);
      process.exit(1);
    });
}

export { deploySecurePOS };