const User = require("../models/User");
const Driver = require("../models/Driver");
const Client = require("../models/Client");


const crypto = require('crypto');
const nodemailer = require('nodemailer');

const isUserValid = (newUser) => {
    const errorList = [];
    const nameRegex = /^[a-zA-Z]+(([',. -][a-zA-Z ])?[a-zA-Z]*)*$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/;

    if (!newUser.firstName) {
        errorList.push('Please enter first name');
    } else if (!nameRegex.test(newUser.firstName)) {
        errorList.push('First name is invalid');
    }
    if (!newUser.lastName) {
        errorList.push('Please enter last name');
    } else if (!nameRegex.test(newUser.lastName)) {
        errorList.push('Last name is invalid');
    }

    if (!newUser.email) {
        errorList.push("Please enter email");
    } else if (!emailRegex.test(newUser.email)) {
        errorList.push("Invalid email format");
    }

    if (!newUser.password) {
        errorList.push("Please enter password");
    }
    // else if (!passwordRegex.test(newUser.password)) {
    //     errorList.push(
    //         "Password should be at least 8 characters long and contain at least one letter and one number"
    //     );
    // }

    if (!newUser.confirmPassword) {
        errorList.push("Please re-enter password in Confirm Password field");
    }

    if (!newUser.UserType) {
        errorList.push("Please enter User Type");
    }

    if (newUser.password !== newUser.confirmPassword) {
        errorList.push("Password and Confirm Password did not match");
    }

    if (errorList.length > 0) {
        return { status: false, errors: errorList };
    } else {
        return { status: true };
    }
};

const saveVerificationToken = async (User_id, verificationToken) => {
    await User.findOneAndUpdate({ _id: User_id }, { "verificationToken": verificationToken });
    return;
}

const generateVerificationToken = () => {
    const token = crypto.randomBytes(64).toString('hex');
    const expires = Date.now() + 3 * 60 * 60 * 1000; // 3 hours from now
    let verificationToken = {
        "token": token,
        "expires": expires
    };
    return verificationToken;
};

// Send an email with a verification link
const sendVerificationEmail = async (email, firstName, lastName, token) => {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            User: "alrahma.hopitale@gmail.com",
            pass: "jgrstcabltioqzxg"
        }
    });

    const mailOptions = {
        from: "AL Rahma Health Center",
        to: email,
        subject: 'Please Verify Your Email Address',
        text: `Dear ${firstName} ${lastName},
    
We are pleased to have you as part of the AL Rahma Health Center community. To complete your registration, please verify your email address by clicking the link below:
    
http://localhost:3001/verify/${token}
    
If you did not create an account with us, please disregard this email.
    
Thank you,
AL Rahma Health Center`,
        html: `<p>Dear ${firstName} ${lastName},</p>
               <p>We are pleased to have you as part of the AL Rahma Health Center community. To complete your registration, please verify your email address by clicking the link below:</p>
               <p><a href="http://localhost:3001/verify/${token}">Verify your email address</a></p>
               <p>If you did not create an account with us, please disregard this email.</p>
               <p>Thank you,<br>AL Rahma Health Center</p>`,
    };

    let resp = await transporter.sendMail(mailOptions);
    return resp;
};


const signUp = (req, res) => {
    const newUser = req.body;

    const UserValidStatus = isUserValid(newUser);
    if (!UserValidStatus.status) {
        res.json({ message: "error", errors: UserValidStatus.errors });
    } else {
        User.create(
            {
                email: newUser.email,
                Username: newUser.email,
                firstName: newUser.firstName,
                lastName: newUser.lastName,
                password: newUser.password,
                UserType: newUser.UserType,
            },
            (error, UserDetails) => {
                if (error) {
                    res.json({ message: "error", errors: [error.message] });
                } else {
                    let verificationToken = generateVerificationToken()
                    saveVerificationToken(UserDetails._id, verificationToken);

                    if (newUser.UserType === "Driver") {
                        Driver.create(
                            {
                                User_id: UserDetails._id,
                                firstName: newUser.firstName,
                                lastName: newUser.lastName,
                                email: newUser.email,
                                Username: newUser.email
                            },
                            (error2, DriverDetails) => {
                                if (error2) {
                                    User.deleteOne({ _id: UserDetails });
                                    res.json({ message: "error", errors: [error2.message] });
                                } else {
                                    res.json({ message: "success" });
                                }
                            }
                        );
                    }
                    if (newUser.UserType === "Client") {
                        Client.create(
                            {
                                User_id: UserDetails._id,
                                firstName: newUser.firstName,
                                lastName: newUser.lastName,
                                email: newUser.email,
                                Username: newUser.firstName + " " + newUser.lastName
                            },
                            (error2, ClientDetails) => {
                                if (error2) {
                                    User.deleteOne({ _id: UserDetails });
                                    res.json({ message: "error", errors: [error2.message] });
                                } else {
                                    sendVerificationEmail(UserDetails.email, newUser.firstName, newUser.lastName, verificationToken.token);
                                    res.json({ message: "success" });
                                }
                            }
                        );
                    }
                }
            }
        );
    }
};

const verifyUser = (req, res) => {
    const token = req.params.id;
    const verifyEmail = async (token) => {
        const User = await User.findOneAndUpdate({
            'verificationToken.token': token,
            'verificationToken.expires': { $gt: Date.now() } // Check that the token has not expired
        }, {
            "activated": true,
            "verificationToken.token": null
        });

        if (!User) {
            console.log("Email could not be verified");
            res.status(500).json({ message: 'Error verifying account' });
        }
        else {
            console.log("Email verified");
            res.send("Email verified");
        }
    };
    verifyEmail(token);
}

module.exports = {
    signUp,
    isUserValid,
    generateVerificationToken,
    saveVerificationToken,
    sendVerificationEmail,
    verifyUser
}

