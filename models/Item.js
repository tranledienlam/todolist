import mongoose from "mongoose";

const itemsSchema = {
    name: String,
    checked: {
        type: Boolean,
        default: false
    },
    
};


export const Item = mongoose.model("Item", itemsSchema);