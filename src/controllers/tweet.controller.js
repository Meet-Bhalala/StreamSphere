import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    const {content}=req.body
    const owner=req.user?._id

    if(!content?.trim())
    {
        throw new ApiError(400,"content is required")
    }

    const tweet=await Tweet.create({
        content,
        owner
    })

    return res.status(201)
    .json(new ApiResponse(201,tweet,"tweet created successfully"))
})

const getUserTweets = asyncHandler(async (req, res) => {
    const {userId}=req.params

    if(!mongoose.Types.ObjectId.isValid(userId))
    {
        throw new ApiError(400,"user id is not valid")
    }
    

    const tweets=await Tweet.find({
        owner:userId
    }).sort({createdAt:-1})

    return res.status(200)
    .json(new ApiResponse(200,{tweets},"all tweets for user id"))
})

const updateTweet = asyncHandler(async (req, res) => {
    const {newcontent}=req.body
    const {tweetId}=req.params

    if(!newcontent?.trim())
    {
        throw new ApiError(400,"content is required")
    }

    if(!mongoose.Types.ObjectId.isValid(tweetId))
    {
        throw new ApiError(400,"tweet id is not valid")
    }

    const tweet = await Tweet.findOneAndUpdate(
        {
            _id:tweetId,
            owner:req.user?._id
        },
        {
            content:newcontent
        },
        {
            new:true
        }
    ) 

    if(!tweet)
    {
        throw new ApiError(404,"tweet not found or not authorized")
    }
    return res.status(200)
    .json(new ApiResponse(200,tweet,"tweet updated successfully"))
})

const deleteTweet = asyncHandler(async (req, res) => {
    const {tweetId}=req.params

    if(!mongoose.Types.ObjectId.isValid(tweetId))
    {
        throw new ApiError(400,"tweet id is not valid")
    }

    const tweet=await Tweet.findOneAndDelete({
        _id:tweetId,
        owner:req.user?._id
    })

    if(!tweet)
    {
        throw new ApiError(404,"tweet not found or not authorized")
    }

    return res.status(200)
    .json(new ApiResponse(200,{},"tweet deleted successfully"))
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}