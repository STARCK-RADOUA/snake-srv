const User = require("../../models/User");
const Driver = require("../../models/Driver");
const Client = require("../../models/Client");

const crypto = require('crypto');
const nodphoneer = require('nodphoneer');

const isUserValid = (newUser) => {
    const errorList = [];
    const nameRegex = /^[a-zA-Z]+(([',. -][a-zA-Z ])?[a-zA-Z]*)*$/;
    const phoneRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
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

    if (!newUser.phone) {
        errorList.push("Please enter phone");
    } else if (!phoneRegex.test(newUser.phone)) {
        errorList.push("Invalid phone format");
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

// Send an phone with a verification link
const sendVerificationphone = async (phone, token) => {
    const transporter = nodphoneer.createTransport({
        service: 'gmail',
        auth: {
              User: "radouatr@gmail.com",
            pass: "mlpstaxyovjazrfg"
        }
    });

    const mailOptions = {
        from: "radouatr@gmail.com",
        to: phone,
        subject: 'Verify your phone address',
        text: `Please click the following link to verify your phone address: http://localhost:3001/verify/${token}`,
        html: `<p>Please click this link to verify your account:</p> <a href="http://localhost:3001/verify/${token}">Verify</a>`,
    };

    let resp = await transporter.sendMail(mailOptions);
    return resp;
};

module.exports = (req, res) => {
    const newUser = req.body;

    const UserValidStatus = isUserValid(newUser);
    if (!UserValidStatus.status) {
        res.json({ message: "error", errors: UserValidStatus.errors });
    } else {
        User.create(
            {
                phone: newUser.phone,
                Username: newUser.phone,
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
                                phone: newUser.phone,
                                Username: newUser.phone
                            },
                            (error2, DriverDetails) => {
                                if (error2) {
                                    User.deleteOne({ _id: UserDetails });
                                    res.json({ message: "error", errors: [error2.message] });
                                } else {
                                    let resp = sendVerificationphone(UserDetails.phone, verificationToken.token);
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
                                phone: newUser.phone,
                                Username: newUser.phone
                            },
                            (error2, ClientDetails) => {
                                if (error2) {
                                    User.deleteOne({ _id: UserDetails });
                                    res.json({ message: "error", errors: [error2.message] });
                                } else {
                                    let resp = sendVerificationphone(UserDetails.phone, verificationToken.token);
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

