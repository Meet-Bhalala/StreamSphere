import mongoose from "mongoose"
import {Comment} from "../models/comment.model.js"
import { Video } from "../models/video.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    let {page = 1, limit = 10} = req.query
    page=Math.max(parseInt(page)||1,1)
    limit=Math.max(parseInt(limit)||10,1)

    if(!videoId || !mongoose.Types.ObjectId.isValid(videoId))
    {
        throw new ApiError(400,"video id is invalid or not given")
    }

    const isvideo=await Video.exists({_id:videoId})

    if(!isvideo)
    {
        throw new ApiError(404,"video does not exist")
    }

    const aggregate=Comment.aggregate([
        {
            $match:{
                video:new mongoose.Types.ObjectId(videoId)
            },
        },
        {
            $lookup:{
                from:"users",
                localField:"owner",
                foreignField:"_id",
                as:"owner"
            }
        },
        {
            $unwind:"$owner"
        },
        {
            $lookup:{
                from:"likes",
                localField:"_id",
                foreignField:"comment",
                as:"likes"
            }
        },

        {
            $addFields:{
                likes:{
                    $size:"$likes"
                }
            }
        },

        {
            $sort:{
                likes:-1,
                createdAt:-1
            }
        },

        {
            $project:{
                comment:"$content",
                likes:1,
                createdAt:1,
                username:"$owner.username",
                avatar:"$owner.avatar"
            }
        }
    ])

    const comments=await Comment.aggregatePaginate(aggregate,{
        page,
        limit
    })
    

    return res.status(200)
    .json(new ApiResponse(200,comments,"comments on video"))
})

const addComment = asyncHandler(async (req, res) => {
    const {videoId}=req.params
    let {content}=req.body
    content=content?.trim()

    if(!videoId || !mongoose.Types.ObjectId.isValid(videoId))
    {
        throw new ApiError(400,"video id is invalid or not given")
    }

    const isvideo=await Video.exists({_id:videoId})

    if(!isvideo)
    {
        throw new ApiError(404,"video does not exist")
    }

    if(!content)
    {
        throw new ApiError(400,"content is required")
    }

    const comment=await Comment.create(
        {
            content,
            video:videoId,
            owner:req.user?._id,
        }
    )

    return res.status(201)
    .json(new ApiResponse(201,comment,"commented successfully"))
})

const updateComment = asyncHandler(async (req, res) => {
    const {commentId}=req.params
    let {updatedContent}=req.body

    if(!commentId || !mongoose.Types.ObjectId.isValid(commentId))
    {
        throw new ApiError(400,"comment id is invalid or not given")
    }
    updatedContent=updatedContent?.trim()
    if(!updatedContent)
    {
        throw new ApiError(400,"new content is required")
    }

    const comment=await Comment.findOneAndUpdate(
        {
            _id:commentId,
            owner:req.user?._id
        },
        {
            content:updatedContent,
        },
        {
            new:true
        }
    ).populate("owner","username avatar")

    if(!comment)
    {
        throw new ApiError(404,"comment is not exist or not authorized")
    }

    return res.status(200)
    .json(new ApiResponse(200,comment,"comment updated successfully"))
})

const deleteComment = asyncHandler(async (req, res) => {
    const {commentId}=req.params

    if(!commentId || !mongoose.Types.ObjectId.isValid(commentId))
    {
        throw new ApiError(400,"comment id is invalid or not given")
    }

    const comment=await Comment.findOneAndDelete(
        {
            _id:commentId,
            owner:req.user?._id
        }
    )

    if(!comment)
    {
        throw new ApiError(404,"comment is not exist or not authorized")
    }

    return res.status(200)
    .json(new ApiResponse(200,{},"comment deleted successfully"))
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
    deleteComment
}