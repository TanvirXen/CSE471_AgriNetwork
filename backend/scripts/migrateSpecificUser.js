// scripts/migrateSpecificUser.js
const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://tanvirishtiaq5:ahVBHv1yDNWMbW3v@cluster0.e2bw5nd.mongodb.net';

async function migrateSpecificUser() {
    console.log('🔄 Attempting to migrate user Fatima Sara...');

    let sourceClient;
    let targetClient;

    try {
        sourceClient = mongoose.createConnection(`${MONGODB_URI}/AgriTest`);
        targetClient = mongoose.createConnection(`${MONGODB_URI}/AgriNetwork`);

        await Promise.all([
            sourceClient.asPromise(),
            targetClient.asPromise()
        ]);
        console.log('✅ Connected to both databases.');

        const sourceDb = sourceClient.db;
        const targetDb = targetClient.db;

        // Find Fatima in the AgriTest database
        const fatima = await sourceDb.collection('users').findOne({ phone: "01912094526" });
        if (!fatima) {
            console.log('❌ Could not find Fatima in AgriTest with that phone number.');
            return;
        }

        console.log(`📂 Found user in AgriTest: ${fatima.fullName} (ID: ${fatima._id})`);

        // Check if there is already a user in AgriNetwork with the same phone
        const existingTargetUser = await targetDb.collection('users').findOne({ phone: "01912094526" });
        if (existingTargetUser) {
            if (existingTargetUser._id.toString() !== fatima._id.toString()) {
                console.log(`⚠️  CONFLICT: A user already exists in AgriNetwork with phone "01912094526", but they have a DIFFERENT _id!`);
                console.log(`   - AgriNetwork _id: ${existingTargetUser._id}`);
                console.log(`   - AgriTest _id:    ${fatima._id}`);
                console.log('   Therefore, we cannot just insert her with her original ID without deleting the AgriNetwork one first.');
                
                // Let's delete the existing target one and insert the source one
                console.log('🗑️  Deleting conflicting user from AgriNetwork...');
                await targetDb.collection('users').deleteOne({ _id: existingTargetUser._id });
            } else {
                console.log('✅ Found matching user by _id in AgriNetwork. We can just update.');
            }
        }

        // Upsert her into AgriNetwork
        const { _id, ...restProps } = fatima;
        const result = await targetDb.collection('users').updateOne(
            { _id },
            { $set: restProps },
            { upsert: true }
        );

        console.log('✅ User successfully migrated and inserted into AgriNetwork!');

    } catch (error) {
        console.error('❌ Migration failed with error:', error);
    } finally {
        if (sourceClient) await sourceClient.close();
        if (targetClient) await targetClient.close();
        console.log('🔌 Connections closed.');
        process.exit(0);
    }
}

migrateSpecificUser();
