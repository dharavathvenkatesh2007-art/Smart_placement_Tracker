import {Schema,model,Types} from 'mongoose';

const studentSchema=new  Schema({   
    userId:{
        type:Types.ObjectId,
        ref:"User",
        required:[true,"User ID is required"]
    },
    education:[
        {
            degree: { type: String, required: [true, "Degree is required"] },
            institution: { type: String, required: [true, "University name is required"] },
            yearOfPassing: { type: Number, required: [true, "Year of passing is required"] },
            cgpa:{
                type:Number,
                required:[true,"CGPA is required"], 
                min:0,
                max:10
            },
            branch: { type: String },
            rollNumber: { type: String }
        } 
    ],
    
    skills:{
        type:[String],
        required:[true,"Skills are required"]
    },
    experience:{
        type:String,
    },
    projects:{
        type:String,
    },
    resumeURL:{
        type:String,
    },
    linkedInLink:{
        type:String
    },
    gitHubLink:{
        type:String
    }
}
,{
    timestamps:true,
    versionKey:false,
    strict:true
});
export  const StudentModel= model("Student",studentSchema); 
