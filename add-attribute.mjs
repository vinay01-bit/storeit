import { Client, Databases } from "node-appwrite";
import fs from "fs";

// Simple env parser
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

async function addAttribute() {
    try {
        console.log("Adding 'starred' attribute to files collection...");
        await databases.createBooleanAttribute(
            envConfig.NEXT_PUBLIC_APPWRITE_DATABASE,
            envConfig.NEXT_PUBLIC_APPWRITE_FILES_COLLECTION,
            "starred",
            false, // required
            false, // default value
            false  // array
        );
        console.log("Successfully initiated attribute creation.");
        console.log("Note: It may take a few seconds for Appwrite to fully apply the schema change.");
    } catch (error) {
        if (error.code === 409) {
            console.log("Attribute 'starred' already exists.");
        } else {
            console.error("Error creating attribute:", error);
        }
    }
}

addAttribute();
