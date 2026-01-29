import { pool } from "../config/db.js";
import { S3Client, HeadObjectCommand } from "@aws-sdk/client-s3";
import { updatePostStatus } from "./posts.js";

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

export const getUploadValidationsInS3 = async (postKeys) => {
    console.log(postKeys);
    const results = await Promise.all(
        postKeys.map(async (key) => {
            const post_id = key.post_id;
            const image_key = key.image_key;
            console.log(post_id)
            console.log(image_key)

            const status = await getUploadValidationInS3(image_key);
            console.log(status);

            let image_url = null;
            let image_url_expiration = null;

            if (status !== "pending") {
                let response;
                try {
                    response = await updatePostStatus(image_key, post_id, status);
                    console.log(response)
                } catch (e) {
                    throw new Error(`updatePostStatus threw for post_id=${post_id}: ${String(e)}`);
                }

                if (!response?.success) {
                    throw new Error(`updatePostStatus failed for post_id=${post_id}`);
                }

                image_url = response.image_url ?? null;
                image_url_expiration = response.image_url_expiration ?? response.image_url_expires ?? null;
            }
            console.log(image_url)
            return { post_id, status, image_url, image_url_expiration };
        })
    );
    return results;
};