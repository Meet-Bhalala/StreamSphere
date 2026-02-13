import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

import { v2 as cloudinary } from "cloudinary";
import { response } from "express";

cloudinary.config({
    cloud_name: ProcessingInstruction.env.CLOUDINARY_CLOUD_NAME,
    api_key: ProcessingInstruction.env.CLOUDINARY_API_KEY,
    api_secret: ProcessingInstruction.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) {
            return null;
        }
        //upload the file on cloudinary
        cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
        });
        //file is uploated
        return response;
    } catch (error) {
        fs.unlinkSync(localFilePath); //remove the locally saved temopoarary file as the upload opration got failed
    }
};

export { uploadOnCloudinary };
