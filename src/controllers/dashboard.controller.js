import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    const channel=req.user?._id 
    const stats={}
    const totalVideo=await Video.countDocuments({owner:channel})
    stats.totalVideos=totalVideo

    const totalViews = await Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(channel)
            }
        },
        {
            $group: {
                _id: null,
                totalViews: { $sum: "$views" }
            }
        }
    ])

    stats.totalViews = totalViews[0]?.totalViews || 0

    const totalLikes=await Like.aggregate([
        {
            $lookup:{
                from:"videos",
                localField:"video",
                foreignField:"_id",
                as:"videoData"
            }
        },
        {
            $unwind:"$videoData"
        },
        {
            $match:{
                "videoData.owner":new mongoose.Types.ObjectId(channel)
            }
        },
        {
            $count:"totalLikes"
        }
    ])

    stats.totalLikes=totalLikes[0]?.totalLikes||0

    const totalSubscribers=await Subscription.countDocuments({channel})

    stats.totalSubscribers=totalSubscribers

    return res.status(200)
    .json(new ApiResponse(200,stats,"Stats fetched successfully"))
})

const getChannelVideos = asyncHandler(async (req, res) => {
    const owner=req.user?._id
    const videos=await Video.find({
        owner,
    })

    return res.status(200)
    .json(new ApiResponse(200,videos,"videos by chennel"))
})

export {
    getChannelStats, 
    getChannelVideos
}