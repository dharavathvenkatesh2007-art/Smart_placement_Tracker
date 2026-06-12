import {Schema,model,Types} from 'mongoose';

const ApplicationSchema=new  Schema({
    userId:{
        type:Types.ObjectId,
        ref:"User",  
        required:[true,"User ID is required"]
    },
    driveId:{
        type:Types.ObjectId,
        ref:"Drive",
        required:[true,"Drive ID is required"]
    },
    status:{
        type:String,
        enum:["PENDING","SHORTLISTED","SELECTED","REJECTED","APPLIED","HIRED"],
        default:"PENDING"
    },
    feedback:{
        type:String,
    },
    studentId:{
        type:Types.ObjectId,
        ref:"Student"
    },
    applicationStatus:{
        type:String,
        enum:["PENDING","SHORTLISTED","SELECTED","REJECTED","APPLIED","HIRED"],
        default:"PENDING"
    }
},{
    timestamps:true,
    versionKey:false,
    strict:true
});
export  const ApplicationModel= model("Application",ApplicationSchema);
