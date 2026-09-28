const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = mongoose.Schema({
    name:{
        type:String,
        required:[true,'Please enter your name: '],
        trim : true
    },
    email:{
        type:String,
        required:[true,'Please enter you email'],
        unique:true,
        lowercase: true,
        trim:true
    },
    password:{
        type:String,
        required: [true, 'Please enter your password'],
        select: false,
        minLength: 6,
    },
    role:{
        type:String,
        enum : ['citizen','authority','admin'],
        default: 'citizen'
    },
    badgeNumber:{
        type:String,
        default:null
    },
    phone:{
        type:String,
        default: ''
    }
},{ timestamps:true })

//Runs before the user.save()
userSchema.pre('save',async function(next){
    if (!this.isModified('password')) return;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
})

userSchema.methods.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);