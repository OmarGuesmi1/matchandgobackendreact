const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
    {
    username: {
        type: String,
        required: true,
        unique: true,
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        required: true,
        enum: ["admin", "candidate", "company"],
        
    },
    cover_User: {
            type: String,
            default: "defaultCover.png" 
        },    logo: { type: String, default: "client.png" },
    companyInfo: {
      description: { type: String },
      location: { type: String },
      category: { 
        type: String, 
        enum: [
          "Tech",
          "Advertising-Marketing",
          "Culture-Media",
          "Consulting-Audit",
          "Education-Training",
          "Finance-Banking"
        ] 
      },      
      founded: { type: Number },
      size: { type: String },
      website: { type: String },
      socialLinks: { 
        linkedin: { type: String } 
      },
    },
},
    {
        timestamps: true,
    }
    
);


module.exports = mongoose.model("User", userSchema)