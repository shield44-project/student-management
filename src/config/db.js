const mongoose=require("mongoose");
let cached=global.__student-managementMongo;
if(!cached) cached=global.__student-managementMongo={conn:null,promise:null};
module.exports=async function connectDB(){if(cached.conn)return cached.conn;if(!process.env.MONGODB_URI)throw new Error("MONGODB_URI is missing");if(!cached.promise)cached.promise=mongoose.connect(process.env.MONGODB_URI,{serverSelectionTimeoutMS:10000}).catch(e=>{cached.promise=null;throw e;});cached.conn=await cached.promise;return cached.conn;};