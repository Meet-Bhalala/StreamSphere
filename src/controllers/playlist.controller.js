import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import { Video } from "../models/video.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    let {name, description} = req.body

    name=name?.trim()
    description=description?.trim()
    if(!name || !description)
    {
        throw new ApiError(400,"All field are required")
    }


    const owner=req.user?._id

    const existPlaylist= await Playlist.findOne(
        {
            name:{$regex:`^${name}$`,$options:"i"},
            owner
        }
    )

    if(existPlaylist)
    {
        throw new ApiError(409,"Same name playlist already exist")
    }
    const playlist=await Playlist.create(
        {
            name,
            description,
            owner,
        }
    )

    return res.status(201)
    .json(new ApiResponse(201,playlist,"playlist created successfully"))
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params

    if(!userId || !mongoose.Types.ObjectId.isValid(userId))
    {
        throw new ApiError(400,"user id is not valid or not given")
    }

    const playlists=await Playlist.aggregate([
        {
            $match:{
                owner:new mongoose.Types.ObjectId(userId),
            }
        },
        {
            $addFields:{
                videoCount:{
                    $size:"$videos"
                },
                firstVideo:{
                    $arrayElemAt:["$videos",0]
                }
            }
        },
        {
            $lookup:{
                from:"videos",
                localField:"firstVideo",
                foreignField:"_id",
                as:"firstVideoData"
            }
        },
        {
            $addFields:{
                thumbnail:{
                    $arrayElemAt:["$firstVideoData.thumbnail",0],
                }
            }
        },
        {
            $project:{
                name:1,
                description:1,
                videoCount:1,
                thumbnail:1,
                createdAt:1,
                updatedAt:1,
                firstVideo:0,
                firstVideoData:0,
            }
        }
    ])

    return res.status(200)
    .json(new ApiResponse(200,playlists,"All playlist of user"))
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params

    if(!playlistId || !mongoose.Types.ObjectId.isValid(playlistId))
    {
        throw new ApiError(400,"playlist id is not valid or not given")
    }

    const playlist=await Playlist.aggregate([
        {
            $match:{
                _id:new mongoose.Types.ObjectId(playlistId),
            }
        },
        {
            
            $addFields:{
                videoCount:{
                    $size:"$videos"
                },
                videos: {
                    $reverseArray: "$videos" 
                }
            }
        },
        {
            $lookup:{
                from:"videos",
                localField:"videos",
                foreignField:"_id",
                as:"videos"
            }
        },
        {
            $addFields:{
                thumbnail:{
                    $arrayElemAt:["$videos.thumbnail",0],
                }
            }
        },
        {
            $project:{
                name:1,
                description:1,
                videoCount:1,
                videos:1,
                thumbnail:1,
                createdAt:1,
                updatedAt:1,
            }
        }
    ])

    if(!playlist.length)
    {
        throw new ApiError(404,"playlist does not exist")
    }

    return res.status(200)
    .json(new ApiResponse(200,playlist[0],"playlist is fetch successfully"))
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    if(!playlistId || !mongoose.Types.ObjectId.isValid(playlistId))
    {
        throw new ApiError(400,"playlist id is not valid or not given")
    }

    if(!videoId || !mongoose.Types.ObjectId.isValid(videoId))
    {
        throw new ApiError(400,"video id is not valid or not given")
    }

    const video=await Video.exists({ _id: videoId })

    if(!video)
    {
        throw new ApiError(404,"video does not exist ")
    }

    const playlist=await Playlist.findOneAndUpdate(
        {
            _id: playlistId,
            owner: req.user?._id
        },
        {
            $addToSet: { videos: videoId }
        },
        { 
            new: true 
        }
    )

    if(!playlist)
    {
        throw new ApiError(404,"playlist does not exist or not authorized")
    }

    return res.status(200)
    .json(new ApiResponse(200,playlist,"video add successfully"))
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params

    if(!playlistId || !mongoose.Types.ObjectId.isValid(playlistId))
    {
        throw new ApiError(400,"playlist id is not valid or not given")
    }

    if(!videoId || !mongoose.Types.ObjectId.isValid(videoId))
    {
        throw new ApiError(400,"video id is not valid or not given")
    }

    const video=await Video.exists({ _id: videoId })

    if(!video)
    {
        throw new ApiError(404,"video does not exist ")
    }

    const playlist=await Playlist.findOneAndUpdate(
        {
            _id: playlistId,
            owner: req.user?._id
        },
        {
            $pull: { videos: videoId }
        },
        { 
            new: true 
        }
    )

    if(!playlist)
    {
        throw new ApiError(404,"playlist does not exist or not authorized")
    }

    return res.status(200)
    .json(new ApiResponse(200,playlist,"video removed from playlist"))
})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params

    if(!playlistId || !mongoose.Types.ObjectId.isValid(playlistId))
    {
        throw new ApiError(400,"playlist id is not valid or not given")
    }

    const playlist=await Playlist.findOneAndDelete(
        {
            _id:playlistId,
            owner:req.user?._id,
        }
    )

    if(!playlist)
    {
        throw new ApiError(404,"playlist does not exist or Not authorized")
    }

    return res.status(200)
    .json(new ApiResponse(200,{},"playlist deleted successfully"))
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    let {name, description} = req.body

    if(!playlistId || !mongoose.Types.ObjectId.isValid(playlistId))
    {
        throw new ApiError(400,"playlist id is not valid or not given")
    }

    name=name?.trim()
    description=description?.trim()
    
    if(!name && !description)
    {
        throw new ApiError(400,"name or description must be changed")
    }

    const updateField={}

    if(name) updateField.name=name
    if(description) updateField.description=description

    const playlist=await Playlist.findOneAndUpdate(
        {
            _id:playlistId,
            owner:req.user?._id,
        },
        updateField,
        {
            new:true,
        }
    )

    if(!playlist)
    {
        throw new ApiError(404,"playlist does not exist or Not authorized")
    }

    return res.status(200)
    .json(new ApiResponse(200,playlist,"playlist updated successfuly"))
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}