console.log('#model PostCategory')
export default (mongoose)=>{
    const PostCategorySchema = new mongoose.Schema({
        name: {},
        slug: {
            type: String,
            required: false,
            trim: true
        },
        type: {
            type: String,
            default: "normal"
        },
        image: String,
        data: {},
        metatitle: {},
        metadescription: {},
        description: {},
        values:[],
        parent:{type: mongoose.Schema.Types.ObjectId, ref: 'CourseCategory'} //category_id
    });
    return PostCategorySchema

};
