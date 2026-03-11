import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) {
            return null;
        }
        //upload the file on cloudinary
        const response=await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
        });
        //file is uploated
        fs.unlinkSync(localFilePath);
        return response;
    } catch (error) {
        fs.unlinkSync(localFilePath); //remove the locally saved temopoarary file as the upload opration got failed
        return null;
    }
};

const deleteOnCloudinary= async (cloudinaryUrl,resource_type="image") => {
    try {
        if(!cloudinaryUrl?.length)
        {
            return true;
        }
        const urlParts = cloudinaryUrl.split('/upload/');
        if (urlParts.length < 2) return false;

        const publicIdWithVersion = urlParts[1];

        const publicId = publicIdWithVersion
            .replace(/^v\d+\//, '')
            .replace(/\.[^/.]+$/, '');

        const { result } = await cloudinary.uploader.destroy(publicId,{resource_type});

        return result === "ok" || result === "not found";

    } catch (error) {
        console.log(error);
        return false;
    }
}

export { uploadOnCloudinary,deleteOnCloudinary };
