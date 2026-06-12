import {Schema,model} from 'mongoose';

const userSchema=new  Schema({
    firstName:{
        type:String,
        required:function(){
            return this.role==="STUDENT"
        }
    },
    lastName:{
        type:String,
        required:function(){
            return this.role==="STUDENT"
        }
        
    },
    companyName:{
        type:String,
        required:function(){
            return this.role==="COMPANY"
        }
    },
    email:{
        type:String,
        required:[true,"Email is required"],
        unique:[true,"Email already exists"]
    },
    password:{
        type:String,
        required:[true,"Password is required"],
        minLength:[6,"Password must be at least 6 characters "]
    },
    role:{
        type:String,
        enum:["STUDENT","COMPANY","ADMIN"],
        required:[true,"Role is required"]
    },
    profileImageURL:{
        type:String
    },
    phone:{
        type:String
    },
    location:{
        type:String
    },
    bio:{
        type:String
    },
    website:{
        type:String
    },
    companyType:{
        type:String,
        enum:["Product Based", "Service Based", "Startup", "MNC", "Government"]
    },
    hrLinkedInLink:{
        type:String
    },
    isUserActive:{
        type:Boolean,
        default:true
    }
},{
    timestamps:true,
    versionKey:false,
    strict:true

});    
export  const UserModel= model("User",userSchema);   
