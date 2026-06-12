import {Schema,model,Types} from 'mongoose';

const studentSchema=new  Schema({  
    userId:{
        type:Types.ObjectId,
        ref:"User",
        required:[true,"Company ID is required"]
    },
    companyName:{
        type:String,
        required:[true,"Company name is required"]
    },
    position:{
        type:String,
        required:[true,"Position is required"]
    },
    ctc:{
        type:Number,
        required:[true,"CTC is required"]
    },
    location:{
        type:String,
        required:[true,"Location is required"]
    },
    jobType:{
        type:String,
        default:"Full-time"
    },
    experience:{
        type:String,
        default:"Freshers"
    },
    description:{
        type:String
    },
    requirements:{
        type:[String],
        default:[]
    },
    selectionProcess:{
        type:[String],
        default:[]
    },
    deadline:{
        type:Date,
        required:[true,"Deadline is required"]
    },
    startDate:{
        type:Date
    },
    openings:{
        type:Number,
        default:1
    },
    status:{
        type:String,
        enum:["ACTIVE", "OPEN", "CLOSED", "BLOCKED"],
        default:"ACTIVE"
    },
    applicants:[{
        type:Types.ObjectId,
        ref:"User"
    }],
    driveDate:{
        type:Date
    },
    minCGPA:{
        type:Number,
        default:0
    },
    requiredSkills:{
        type:[String],
        default:[]
    },
    jobDescription:{
        type:String,
    },
    driveStatus:{
        type:String,
        enum:["UPCOMING","ONGOING","COMPLETED"],
        default:"UPCOMING"
    }
}
,{
    timestamps:true,
    versionKey:false,
    strict:true
});

export  const DriveModel= model("Drive",studentSchema);