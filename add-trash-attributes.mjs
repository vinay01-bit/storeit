import { Client, Databases } from "node-appwrite";
import fs from "fs";

const envConfig = fs.readFileSync('.env.local', 'utf-8')
    .split('\n')
    .filter(line => line.trim() && !line.startsWith('#'))
    .reduce((acc, line) => {
        const [key, ...val] = line.split('=');
        if (key && val) {
            acc[key.trim()] = val.join('=').trim().replace(/^"|"$/g, '');
        }
        return acc;
    }, {});

const client = new Client()
    .setEndpoint(envConfig.NEXT_PUBLIC_APPWRITE_ENDPOINT)
    .setProject(envConfig.NEXT_PUBLIC_APPWRITE_PROJECT)
    .setKey(envConfig.NEXT_APPWRITE_KEY.trim());

const databases = new Databases(client);

async function addAttributes() {
    const dbId = envConfig.NEXT_PUBLIC_APPWRITE_DATABASE;
    const colId = envConfig.NEXT_PUBLIC_APPWRITE_FILES_COLLECTION;

    const attrs = [
        {
            fn: () => databases.createBooleanAttribute(dbId, colId, "isDeleted", false, false, false),
            name: "isDeleted"
        },
        {
            fn: () => databases.createStringAttribute(dbId, colId, "deletedAt", 64, false, null, false),
            name: "deletedAt"
        }
    ];

    for (const attr of attrs) {
        try {
            console.log(`Adding '${attr.name}' attribute...`);
            await attr.fn();
            console.log(`✓ '${attr.name}' created. Wait a few seconds for propagation.`);
        } catch (error) {
            if (error.code === 409) {
                console.log(`⚠ '${attr.name}' already exists, skipping.`);
            } else {
                console.error(`✗ Error creating '${attr.name}':`, error.message);
            }
        }
    }
}

addAttributes();
