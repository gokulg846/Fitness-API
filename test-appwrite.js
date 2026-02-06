const { Client, Databases } = require("node-appwrite");
require("dotenv").config();

async function testAppwrite() {
    console.log("🔵 Testing Appwrite Connection...");
    console.log(`   Endpoint: ${process.env.APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1"}`);
    console.log(`   Project: ${process.env.PROJECT_ID || "698560cb003bcdb1c88e"}`);

    const client = new Client();
    client
        .setEndpoint(process.env.APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1")
        .setProject(process.env.PROJECT_ID || "698560cb003bcdb1c88e")
        .setKey(process.env.API_KEY);

    const database = new Databases(client);

    const dummyData = {
        date: "Test Entry " + new Date().toISOString(),
        step_count: 100,
        heart_rate: 75.5
    };

    try {
        // Replace with your actual Database and Collection IDs if they are not in .env
        const dbId = process.env.APPWRITE_DATABASE_ID || '69857181003ac4557049'; 
        const collId = process.env.APPWRITE_COLLECTION_ID || 'fit_web_table';

        console.log(`   Target DB: ${dbId}`);
        console.log(`   Target Collection: ${collId}`);

        const result = await database.createDocument(
            dbId,
            collId,
            'unique()',
            dummyData
        );
        console.log("✅ Success! Document created with ID:", result.$id);
        console.log("   Appwrite is working correctly.");
    } catch (error) {
        console.error("❌ Appwrite Connection Failed:");
        console.error("   Error Message:", error.message);
        console.error("   Check your API_KEY permissions (need 'databases.write') and IDs.");
    }
}

testAppwrite();
