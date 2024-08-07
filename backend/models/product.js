const mongoose = require('mongoose')

const Schema = mongoose.Schema;

const bcrypt = require('bcrypt')

var uniqueValidator = require('mongoose-unique-validator')

const ProductSchema = new Schema({
	OrderId: {
		type: mongoose.Schema.Types.ObjectId,
		ref: "Order"
	},
	productElements: [{
		medicineId: {
			type: mongoose.Schema.Types.ObjectId,
			ref: "Medicine"
		},
		dosage: {
			type: String
		},
		qty: {
			type: Number
		}
	}],
	remarks: {
		type: String
	},
	paid: {
		type: Boolean,
		default: 0
	}
},
{
	timestamps: true
}
);

const Precription = mongoose.model('Product', ProductSchema);

module.exports = Precription;