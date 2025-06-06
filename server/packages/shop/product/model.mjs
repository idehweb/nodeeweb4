import {string} from "mathjs";

console.log('#model product')
export default (mongoose)=>{
    const ProductSchema = new mongoose.Schema({
        createdAt: { type: Date, default: Date.now },
        updatedAt: { type: Date, default: Date.now },
        active: { type: Boolean, default: true },
        oneItemPerOrder: { type: Boolean, default: false },
        notBuyableAlone: { type: Boolean, default: false },
        productCategory: [{ type: mongoose.Schema.Types.ObjectId, ref: "ProductCategory" }],
        attributes: [{attribute:{ type: mongoose.Schema.Types.ObjectId, ref: "Attributes" },values:[]}],
        sources: [],
        comment: [{
            createdAt: { type: Date, default: Date.now },
            rate: Number,
            customer_data: {},
            text:{},
            child:[]
        }],
        labels: [],
        in_stock: { type: Boolean, default: false },
        story: { type: Boolean, default: false },
        price: Number,
        weight: Number,
        quantity: Number,
        salePrice: Number,
        data: {},
        sku: String,
        extra_button: String,
        miniTitle: {},
        excerpt: {},
        options: [],
        extra_attr: [],
        combinations: [],
        sections: [],
        countries: [],
        like: [{
            customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer"},
            userIp: String,
            createdAt: { type: Date, default: Date.now }
        }],
        customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer" },
        type: { type: String, default: "normal" },
        description: {},
        requireWarranty:{},

        views: [],
        addToCard: [],
        title: {},
        metatitle: {},
        metadescription: {},
        keywords: {},
        slug: {
            type: String,
            unique: true,
            required: true,
            trim: true
        },
        thumbnail: String,
        photos: [],
        normalBarcode: String,
        status: { type: String, default: "processing" },
        transaction: [{ type: mongoose.Schema.Types.ObjectId, ref: "Transaction" }],
        relatedProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
        postNumber: String
    });
    return ProductSchema

};
