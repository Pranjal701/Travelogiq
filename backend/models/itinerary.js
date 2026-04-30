import mongoose from "mongoose"

const itinerarySchema = mongoose.Schema({
    user_id:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'users',
        required: true,
    },
    destination:{
        type: String,
        required: true,
    },
    startDate:{
        type: Date,
        required: true,
    },
    endDate:{
        type: Date,
        required: true,
    },
    budget:{
        type: String,
        required: true,
    },
    group:{
        type:String,
        required: true,
    },
    interest:{
        type: Array,
        required: true,
    },
    pacing:{
        type: String,
        required: true,
    },
    image_number: {
        type: Number,
        required: true,
    },
    photoRef: {
        type: String,
        default: null
    },
    generatedData: {
        type: Object,
        default: null
    },
    regenerationInstructions: {
        type: String,
        default: null
    }
}, {timestamps: true});

const Itinerary = mongoose.model('itinerary', itinerarySchema);

export default Itinerary;