const mongoose = require('mongoose');
const jwt = require('jsonwebtoken')
const User = require('../Models/users')

const generateToken = (id,role)=>{
    return jwt.sign({id,role}, process.env.JWT_SECRET, {
        expiresIn: '7d'
    })
};

exports.register = async(req,res)=>{
    try{
        const{name,email,password,role,badgeNumber,phone} = req.body;

        const userExists = await User.findOne({ email });

        if(userExists){
            return res.status(400).json({success:false,message:"Email already registered"})
        }

        const users = await User.create({
            name,email,password,
            role: role || 'citizen',
            badgeNumber : role === 'authority' ? badgeNumber : null, 
            phone
        })
        
        const token = generateToken(users._id, users.role);

        res.status(200).json({
            success:true,
            token,
            user:{
                id: users._id,
                name: users.name,
                email: users.email,
                role: users.role,
                badgeNumber: users.badgeNumber
            }
        })
    }
    catch(err){
        return res.status(500).json({
            success:false, message: err.message
        })
    }
}

exports.login = async (req,res)=>{
    try{
        const {email, password} = req.body;
        if(!email || !password){
            return res.status(400).json({
                success: false, message:'Please provide email and password'
            })
        }

         const user = await User.findOne({email}).select('+password');

           if (!user || !(await user.matchPassword(password))) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

         const token = generateToken(user._id, user.role);
        res.status(200).json({
            success: true,
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                badgeNumber: user.badgeNumber
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
}

exports.getMe = async(req,res)=>{
    return res.status(200).json({
        success:true,
        user:req.user
    });
}