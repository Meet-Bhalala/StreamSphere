import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params

    if(!channelId || !mongoose.Types.ObjectId.isValid(channelId))
    {
        throw new ApiError(400,"channel id is invalid or not exist")
    }

    let sub=await Subscription.findOne(
        {
            subscriber:req.user?._id,
            channel:channelId
        }
    )

    if(sub)
    {
        await sub.deleteOne()
        sub=null
    }
    else{
        sub=await Subscription.create(
            {
                subscriber:req.user?._id,
                channel:channelId
            }
        )
    }

    return res.status(200)
    .json(new ApiResponse(200,sub||{},"Subscription toggled successfully"))

})


const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params

    if(!channelId || !mongoose.Types.ObjectId.isValid(channelId))
    {
        throw new ApiError(400,"channel id is invalid or not exist")
    }

    const subscribers=await Subscription.aggregate([
        {
            $match:{
                channel:new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $lookup:{
                from:"users",
                localField:"subscriber",
                foreignField:"_id",
                as:"subscriber",
                pipeline:[
                    {
                        $project:{
                            username:1,
                            avatar:1,
                        }
                    }
                ]
            }
        },
        {
            $addFields:{
                subscriber:{
                    $first:"$subscriber",
                }
            }
        }
    ])

    return res.status(200)
    .json(new ApiResponse(200,subscribers,"subscribers of this channel"))
})


const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
    if(!subscriberId || !mongoose.Types.ObjectId.isValid(subscriberId))
    {
        throw new ApiError(400,"subscriber id is invalid or not exist")
    }

    const channels=await Subscription.aggregate([
        {
            $match:{
                subscriber:new mongoose.Types.ObjectId(subscriberId)
            }
        },
        {
            $lookup:{
                from:"users",
                localField:"channel",
                foreignField:"_id",
                as:"channel",
                pipeline:[
                    {
                        $project:{
                            username:1,
                            avatar:1,
                            coverImg:1,
                        }
                    }
                ]
            }
        },
        {
            $addFields:{
                channel:{
                    $first:"$channel",
                }
            }
        }
    ])

    return res.status(200)
    .json(new ApiResponse(200,channels,"channels that subscribed by user"))
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}