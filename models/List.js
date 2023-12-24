import mongoose from "mongoose";

const listSchema = {  
    name: {
        type: String,
    },
    items: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Item',
    }],
    dateby: {
        type: Date,
    }
}

export const List = mongoose.model("List", listSchema);
