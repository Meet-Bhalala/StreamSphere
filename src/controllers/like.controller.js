import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Video } from "../models/video.model.js"
import { Tweet } from "../models/tweet.model.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params

    if(!videoId || !mongoose.Types.ObjectId.isValid(videoId))
    {
        throw new ApiError(400,"video id is invalid or not exist")
    }

    const video=await Video.exists({_id:videoId})

    if(!video)
    {
        throw new ApiError(404,"video does not exist")
    }

    const isLiked=await Like.findOneAndDelete(
        {
            video:videoId,
            likedBy:req.user?._id
        }
    )

    if(isLiked)
    {
        return res.status(200)
        .json(new ApiResponse(200,{},"removed like from video"))
    }
    else
    {
        const like=await Like.create(
            {
                video:videoId,
                likedBy:req.user?._id
            }
        )

        return res.status(200)
        .json(new ApiResponse(200,like,"video liked successfully"))
    }
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params

    if(!commentId || !mongoose.Types.ObjectId.isValid(commentId))
    {
        throw new ApiError(400,"comment id is invalid or not exist")
    }

    const comment=await Comment.exists({_id:commentId})

    if(!comment)
    {
        throw new ApiError(404,"comment does not exist")
    }

    const isLiked=await Like.findOneAndDelete(
        {
            comment:commentId,
            likedBy:req.user?._id
        }
    )

    if(isLiked)
    {
        return res.status(200)
        .json(new ApiResponse(200,{},"removed like from comment"))
    }
    else
    {
        const like=await Like.create(
            {
                comment:commentId,
                likedBy:req.user?._id
            }
        )

        return res.status(200)
        .json(new ApiResponse(200,like,"comment liked successfully"))
    }
})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params

    if(!tweetId || !mongoose.Types.ObjectId.isValid(tweetId))
    {
        throw new ApiError(400,"tweet id is invalid or not exist")
    }

    const tweet=await Tweet.exists({_id:tweetId})

    if(!tweet)
    {
        throw new ApiError(404,"tweet does not exist")
    }

    const isLiked=await Like.findOneAndDelete(
        {
            tweet:tweetId,
            likedBy:req.user?._id
        }
    )

    if(isLiked)
    {
        return res.status(200)
        .json(new ApiResponse(200,{},"removed like from tweet"))
    }
    else
    {
        const like=await Like.create(
            {
                tweet:tweetId,
                likedBy:req.user?._id
            }
        )

        return res.status(200)
        .json(new ApiResponse(200,like,"tweet liked successfully"))
    }
})

const getLikedVideos = asyncHandler(async (req, res) => {

    const likedVideos = await Like.aggregate([
        {
            $match: {
                likedBy: new mongoose.Types.ObjectId(req.user._id),
                video: { $exists: true }
            }
        },
        {
            $sort: {
                createdAt: -1 
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "videos"
            }
        },
        {
            $unwind:"$videos"
        },
        {
            $group: {
                _id: null,
                videos: { $push: "$videos" },
                videoCount: { $sum: 1 }
            }
        },
        {
            $project: {
                _id: 0,
                videoCount: 1,
                videos: 1
            }
        }
    ])

    return res.status(200)
    .json(new ApiResponse(200,likedVideos[0] || {videoCount:0,videos:[]},"liked videos"))
})

const getLikedTweets = asyncHandler(async (req,res)=>{

    const likedTweets = await Like.aggregate([
        {
            $match:{
                likedBy:new mongoose.Types.ObjectId(req.user._id),
                tweet:{
                    $exists:true 
                }
            }
        },
        { 
            $sort:{ 
                createdAt:-1 
            }
        },
        {
            $lookup:{
                from:"tweets",
                localField:"tweet",
                foreignField:"_id",
                as:"tweets"
            }
        },
        {
            $unwind:"$tweets"
        },
        {
            $group:{
                _id:null,
                tweets:{ $push:"$tweets" },
                tweetCount:{ $sum:1 }
            }
        },
        {
            $project:{
                _id:0,
                tweetCount:1,
                tweets:1
            }
        }
    ])

    return res.status(200)
    .json(new ApiResponse(200,likedTweets[0] || {tweetCount:0,tweets:[]},"liked tweets"))

})

const getLikedComments = asyncHandler(async (req,res)=>{

    const likedComments = await Like.aggregate([
        {
            $match:{
                likedBy:new mongoose.Types.ObjectId(req.user._id),
                comment:{  
                    $exists:true 
                }
            }
        },
        { 
            $sort:{
                createdAt:-1 
            } 
        },
        {
            $lookup:{
                from:"comments",
                localField:"comment",
                foreignField:"_id",
                as:"comments"
            }
        },
        {
            $unwind:"$comments"
        },
        {
            $group:{
                _id:null,
                comments:{ $push:"$comments" },
                commentCount:{ $sum:1 }
            }
        },
        {
            $project:{
                _id:0,
                commentCount:1,
                comments:1
            }
        }
    ])

    return res.status(200)
    .json(new ApiResponse(200,likedComments[0] || {commentCount:0,comments:[]},"liked comments"))

})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos,
    getLikedTweets,
    getLikedComments,
}