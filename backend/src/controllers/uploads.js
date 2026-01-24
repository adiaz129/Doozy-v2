import { s3, BUCKET_NAME } from "../config/s3Client.js";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";
import { setUploadValidationInDB } from "../services/uploads.js";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const getUploadUrl = async (req, res) => {
    try {
        const userId = req.user.uid;
        const route = req.params.route;

        const allowedRoutes = ["profilePic", "post"];
        if (!allowedRoutes.includes(route)) {
            return res.status(400).json({ message: "Invalid upload type" });
        }

        const s3Key = `${route}/${userId}/pending/${Date.now()}.jpg`;
        const validatedKey = `${route}/${userId}/validated/${Date.now()}.jpg`;
        const acl = route === "profilePic" ? "public-read" : "private";
        const presignedPost = await createPresignedPost(s3, {
            Bucket: BUCKET_NAME,
            Key: s3Key,
            Fields: {
                "Content-Type": "image/jpeg",
                ACL: acl
            },
            Conditions: [
                ["content-length-range", 0, 5 * 1024 * 1024],
                ["starts-with", "$key", `${route}/${userId}/`],
                ["starts-with", "$Content-Type", "image/"],
                ["eq", "$ACL", acl]
            ],
            Expires: 300,
        })
        
        return res.status(200).json({url: presignedPost.url, fields: presignedPost.fields, key: validatedKey});
    } catch (error) {
        console.error(err);
        res.status(500).json({ message: "Failed to generate presigned URL" });
    }
}

export const setUploadValidation = async (req, res) => {
    try {
        const key = req.body.s3_key;
        const validated = req.body.validated;
        const response = await setUploadValidationInDB(key, validated);
        if (response.success) {
            return res.status(200).json(response);
        }
        else {
            return res.status(500).json(response);
        }
    } catch (error) {
        console.error("Error in setUploadValidation:", error);
        return res.status(500).json({ message: "Server error" });
    }
}

export const getPresignedURL = async (key) => {
    const s3 = new S3Client({ region: process.env.AWS_REGION });
    const command = new GetObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: key,
    });

    const url = await getSignedUrl(s3, command, { expiresIn: 60 * 5 });
    return url;
}