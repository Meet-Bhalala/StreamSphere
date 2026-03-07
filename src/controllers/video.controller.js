import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {deleteOnCloudinary, uploadOnCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    let { page = 1, limit = 10, query, sortBy="createdAt", sortType, userId } = req.query
    page=Math.max(1, parseInt(page))
    limit=Math.max(1, parseInt(pagelimit))

    if(!userId || !mongoose.Types.ObjectId.isValid(userId))
    {
        throw new ApiError(400,"user id is not valid or not given")
    }

    const filter={}
    filter.owner=userId
    if(query)
    {
        filter.title={$regex:query,$options:"i"}
    }

    const sortTypeNo=sortType!="desc"?1:-1;

    const videos=await Video.find(
        filter
    )
    .sort({[sortBy]:sortTypeNo})
    .skip((page-1)*limit)
    .limit(limit)

    res.status(200)
    .json(new ApiResponse(200,videos,"Videos is given"))
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    if(!title || !description)
    {
        throw new ApiError(400,"title and description required");
    }
    const localVideoFile=req.files?.videoFile[0].path;
    const localThumbnail=req.files?.thumbnail[0].path;
    if(!localVideoFile || !localThumbnail)
    {
        throw new ApiError(400,"Video file and Thumbnail is required")
    }


    const videoFile=await uploadOnCloudinary(localVideoFile)
    const thumbnail=await uploadOnCloudinary(localThumbnail)
    if(!videoFile?.url || !thumbnail?.url)
    {
        throw new ApiError(500,"something went wrong")
    }

    const owner=req.user?._id

    console.log(videoFile);
    const video= await Video.create({
        videoFile:videoFile.url,
        thumbnail:thumbnail.url,
        title,
        description,
        duration:videoFile.duration  || 0,
        owner
    })

    return res.status(200)
    .json(new ApiResponse(200,video,"video published successfully"))

})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if(!mongoose.Types.ObjectId.isValid(videoId))
    {
        throw new ApiError(400,"video id is not valid")
    }

    const video=await Video.findByIdAndUpdate(videoId,
        {
            $inc:{views:1}
        },
        {
            new:true,
        }
    ).populate("owner","fullName email username")

    if(!video)
    {
        throw new ApiError(404,"Video does not exist")
    }

    return res.status(200)
    .json(new ApiResponse(200,video,"Video fetched successfully"))
})


const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if(!mongoose.Types.ObjectId.isValid(videoId))
    {
        throw new ApiError(400,"video id is not valid")
    }

    const video=await Video.findById(videoId);

    if(!video)
    {
        throw new ApiError(404,"video does not exist")
    }

    if(video.owner.toString()!==req.user?._id.toString())
    {
        throw new ApiError(403,"Not authorized to update")
    }

     const {title,description}=req.body

    const thumbnailLocalPath=req.file?.path
    
    if(!title && !description && !thumbnailLocalPath)
    {
        throw new ApiError(400,"there is nothing to update")
    }

    if(title) video.title=title;
    if(description) video.description=description
    let oldThumbnail

    if(thumbnailLocalPath)
    {
        const thumbnail=await uploadOnCloudinary(thumbnailLocalPath);
        if(thumbnail?.url)
        {
            oldThumbnail=video.thumbnail
            video.thumbnail=thumbnail.url
        } 
    }

    await video.save();

    if(oldThumbnail)
    {
        await deleteOnCloudinary(oldThumbnail)
    }

    return res.status(200)
    .json(new ApiResponse(200,video,"video is updated successfully"))

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if(!mongoose.Types.ObjectId.isValid(videoId))
    {
        throw new ApiError(400,"video id is not valid")
    }

    const video=await Video.findOneAndDelete({
        _id:videoId,
        owner:req.user?._id,
    });

    if(!video)
    {
        throw new ApiError(404,"video does not exist or Not authorized")
    }

    await deleteOnCloudinary(video.videoFile,"video")
    await deleteOnCloudinary(video.thumbnail)

    return res.status(200)
    .json(new ApiResponse(200,{},"Video deleted successfully"))

})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if(!mongoose.Types.ObjectId.isValid(videoId))
    {
        throw new ApiError(400,"video id is not valid")
    }

    const video = await Video.findOne({
        _id:videoId,
        owner:req.user?._id,
    })

    if(!video)
    {
        throw new ApiError(404,"video does not exist or Not authorized")
    }

    video.isPublished=!video.isPublished
    await video.save();
    return res.status(200)
    .json(new ApiResponse(200,video,"video publish toggled"))
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}