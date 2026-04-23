// scripts/migrateDatabase.js
const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb+srv://tanvirishtiaq5:ahVBHv1yDNWMbW3v@cluster0.e2bw5nd.mongodb.net';

async function migrate() {
    console.log('🔄 Starting MongoDB Migration from AgriTest to AgriNetwork...');

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

        const collections = await sourceDb.listCollections().toArray();
        console.log(`📂 Found ${collections.length} collections in AgriTest.`);

        for (const collInfo of collections) {
            const collName = collInfo.name;
            // Ignore system collections
            if (collName.startsWith('system.')) continue;

            console.log(`\n⬇️  Processing collection: ${collName}`);

            const sourceColl = sourceDb.collection(collName);
            const targetColl = targetDb.collection(collName);

            const documents = await sourceColl.find({}).toArray();
            
            if (documents.length === 0) {
                console.log(`    - Collection is empty, skipping.`);
                continue;
            }

            console.log(`    - Found ${documents.length} documents. Preparing bulk update...`);

            const bulkOps = documents.map((doc) => {
                const { _id, ...restProps } = doc;
                
                let updatePayload = {};
                
                // Construct the update cleanly. 
                // We use $set for all properties except _id to avoid immutability errors.
                if (Object.keys(restProps).length > 0) {
                    updatePayload = { $set: restProps };
                } else {
                    // For perfectly empty objects besides the ObjectId
                    updatePayload = { $setOnInsert: { _id } };
                }

                return {
                    updateOne: {
                        filter: { _id },
                        update: updatePayload,
                        upsert: true
                    }
                };
            });

            try {
                const result = await targetColl.bulkWrite(bulkOps);
                console.log(`    ✅ Success for '${collName}':`);
                console.log(`       - Inserted (New): ${result.upsertedCount}`);
                console.log(`       - Updated (Overwritten): ${result.modifiedCount}`);
                // Matched logic
                console.log(`       - Unchanged: ${result.matchedCount - result.modifiedCount}`);
            } catch (bulkError) {
                console.error(`    ❌ Error processing collection ${collName}:`, bulkError.message);
            }
        }
        
        console.log('\n🎉 Migration process completed entirely!');

    } catch (error) {
        console.error('❌ Migration failed with error:', error);
    } finally {
        if (sourceClient) await sourceClient.close();
        if (targetClient) await targetClient.close();
        console.log('🔌 Connections closed.');
        process.exit(0);
    }
}

migrate();
