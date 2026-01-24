import { pool } from "../config/db.js";
import { S3Client, HeadObjectCommand } from "@aws-sdk/client-s3";

export const setUploadValidationInDB = async (key, validated) => {
    try {
        const q = `INSERT INTO upload_validation (upload_key, validated) VALUES (?, ?);`;
        const values = [key, validated];
        await pool.query(q, values);

        return { success: true, message: "Upload validation complete." };
    } catch (error) {
        console.log(error);
        return { success: false, message: "Failed to validate upload." }
    }
}

export const getUploadValidationInS3 = async (key) => {
    const s3 = new S3Client({ region: "us-west-1" });
    const bucket = process.env.S3_BUCKET_NAME;

    try {
        await s3.send(
            new HeadObjectCommand({
                Bucket: bucket,
                Key: key,
            })
        );
        return "validated";
    } catch (err) {
        if (err.$metadata?.httpStatusCode !== 404) {
            throw err; // real S3 error
        }
    }

    const rejectedKey = key.replace("/validated/", "/rejected/");
    try {
        await s3.send(
            new HeadObjectCommand({
                Bucket: bucket,
                Key: rejectedKey,
            })
        );
        return "rejected";
    } catch (err) {
        if (err.$metadata?.httpStatusCode === 404) {
            return "pending";
        }
        throw err;
    }
}