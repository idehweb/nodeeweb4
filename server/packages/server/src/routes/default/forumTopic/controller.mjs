import _ from "lodash";
// const rp from 'request-promise');

var self = ({

    all: async function(req, res, next) {
        const ForumTopic = req.mongoose.model('ForumTopic');
        try {
            const offset = req.params.offset ? parseInt(req.params.offset) : 0;
            const limit = req.params.limit || 10; // Set default limit if not provided
            const search = {}; // Your search filter can be added here

            // console.log("Fetching all attributes...", search);

            // Get the list of attributes with pagination
            const questionCategories = await ForumTopic.find(search)
                .skip(offset)
                .sort({ _id: -1 })
                .limit(limit);

            if (!questionCategories) {
                console.log("questionCategories not found!")
                return res.status(404).json({
                    success: false,
                    message: "questionCategories not found!"
                });
            }
            // console.log("questionCategories",questionCategories)

            // Get the total count of documents
            const count = await ForumTopic.countDocuments(search);
            // console.log("count",count)

            // Set the total count in the response header
            res.setHeader("X-Total-Count", count);

            // Return the result
            return res.json(questionCategories);

        } catch (err) {
            console.error("Error fetching attributes:", err);
            return res.status(500).json({
                success: false,
                message: "Error fetching attributes!",
                error: err.message
            });
        }
  },
    f: function(req, res, next) {
        console.log("fetch all f...");
        let offset = 0;
        if (req.params.offset) {
            offset = parseInt(req.params.offset);
        }

        let search = {};
        search["parent"] = {
            $exists: false
        };
        // console.log('search', search);
        Attributes.find(search, function(err, attributess) {
            // console.log('err', err);
            // console.log('attributess', attributess);
            if (err || !attributess) {
                res.json({
                    success: false,
                    message: "error!",
                    attributess: attributess
                });
                return 0;
            }
            Attributes.countDocuments({}, function(err, count) {
                // console.log('countDocuments', count);
                if (err || !count) {
                    res.json({
                        success: false,
                        message: "error!"
                    });
                    return 0;
                }
                res.setHeader(
                    "X-Total-Count",
                    count
                );
                res.json(attributess);
                return 0;


            });

        }).skip(offset).sort({ _id: -1 }).limit(parseInt(req.params.limit));
    },

    allS: function(req, res, next) {
        return new Promise(function(resolve, reject) {
            let offset = 0;
            if (req.params.offset) {
                offset = parseInt(req.params.offset);
            }

            let search = {};
            search["name." + req.headers.lan] = {
                $exists: true
            };
            Attributes.find(search, function(err, attributess) {
                if (err || !attributess) {
                    resolve([]);

                }
                Attributes.countDocuments({}, function(err, count) {
                    // console.log('countDocuments', count);
                    if (err || !count) {
                        resolve([]);

                    }
                    res.setHeader(
                        "X-Total-Count",
                        count
                    );
                    _.forEach(attributess, (c) => {
                        c.name = c["name"][req.headers.lan];
                        // console.log(c);
                    });
                    resolve(attributess);


                });

            }).skip(offset).sort({ _id: -1 }).limit(parseInt(req.params.limit));
        });
    },
    allSXml: async function() {
        let XTL = [{
            url: "/",
            lastMod: new Date(),
            changeFreq: "hourly"
        },
            {
                url: "/add-new-post",
                lastMod: new Date(),
                changeFreq: "monthly"
            }], offset = 0, search = {};
        return new Promise(async function(resolve, reject) {

            await Attributes.find(search, async function(err, attributess) {
                if (err || !attributess) {
                    return await ([]);
                }
                await console.log("allSXml1", "allSXml1");
                let cd = new Date();
                await _.forEach(attributess, async (c) => {
                    await XTL.push({
                        url: "/attributes/" + c._id + "/" + c.name["fa"],
                        lastMod: cd,
                        changeFreq: "daily"
                    });
                });
                search["active"] = true;
                await Post.find(search, async function(err, posts) {
                    await _.forEach(posts, async (p) => {
                        await XTL.push({
                            url: "/p/" + p._id + "/" + p.title["fa"],
                            lastMod: p.updatedAt,
                            changeFreq: "weekly"
                        });
                    });
                    resolve(XTL);
                }).skip(offset).sort({ _id: -1 });


            }).skip(offset).sort({ _id: -1 });
        });
    },
    level:

        function(req, res, next) {
            let offset = 0;
            if (req.params.offset) {
                offset = parseInt(req.params.offset);
            }

            let search = {};
            if (!req.params.catId) {
                search["parent"] = null;
            } else {
                search["parent"] = req.params.catId;
            }
            search["name." + req.headers.lan] = {
                $exists: true
            };
            // console.log(search);
            Attributes.find(search, function(err, attributess) {
                if (err || !attributess) {
                    res.json({
                        success: false,
                        message: "error!"
                    });
                    return 0;
                }
                Attributes.countDocuments({}, function(err, count) {
                    // console.log('countDocuments', count);
                    if (err || !count) {
                        res.json({
                            success: false,
                            message: "error!"
                        });
                        return 0;
                    }
                    res.setHeader(
                        "X-Total-Count",
                        count
                    );
                    _.forEach(attributess, (c) => {
                        c.name = c["name"][req.headers.lan];
                        // console.log(c);
                    });
                    res.json(attributess);
                    return 0;


                });

            }).skip(offset).sort({ _id: -1 }).limit(parseInt(req.params.limit));
        }

    ,
    s: function(req, res, next) {
        console.log("s()...");
        let offset = 0;
        if (req.params.offset) {
            offset = parseInt(req.params.offset);
        }

        let search = {};
        if (!req.params.catId) {
            search["parent"] = null;
        } else {
            search["parent"] = req.params.catId;
        }
        search["name." + req.headers.lan] = {
            $exists: true
        };
        // console.log('jhgfghj', search);
        Attributes.find(search, function(err, attributess) {
            if (err) {
                res.json({
                    success: false,
                    message: "error!"
                });
                return 0;
            }
            if (!attributess) {
                attributess = [];
                // res.json({
                //     success: true,
                //     message: 'error!'
                // });
                // return 0;
            }
            // console.log(attributess);
            _.forEach(attributess, (c) => {
                c.name = c["name"][req.headers.lan];
                // console.log(c);
            });
            // attributess.push({});
            Attributes.countDocuments({}, function(err, count) {
                // console.log('countDocuments', count);
                if (err || !count) {
                    res.json({
                        success: false,
                        message: "error!"
                    });
                    return 0;
                }
                res.setHeader(
                    "X-Total-Count",
                    count
                );
                if (req.params.catId)
                    Attributes.findById(req.params.catId, function(err, mainCat) {
                        // console.log('here');
                        // if (attributess && attributess.length >= 0) {
                        //   if (mainCat) {
                        //     mainCat.back = true;
                        //     mainCat.name = mainCat['name'][req.headers.lan];
                        //     attributess[attributess.length] = mainCat;
                        //   }
                        // }
                        res.json(attributess.reverse());
                        return 0;
                    }).lean();
                else {
                    res.json(attributess.reverse());
                    return 0;
                }


            });

        }).skip(offset).sort({ _id: -1 }).limit(parseInt(req.params.limit)).lean();
    },
    sidebar: function(req, res, next) {
        console.log("sidebar()...");
        let offset = 0;
        if (req.params.offset) {
            offset = parseInt(req.params.offset);
        }

        let search = {};
        if (!req.params.catId) {
            search["parent"] = null;
        } else {
            search["parent"] = req.params.catId;
        }
        search["name." + req.headers.lan] = {
            $exists: true
        };
        // console.log('jhgfghj', search);
        Attributes.find(search, function(err, attributess) {
            if (err) {
                res.json({
                    success: false,
                    message: "error!"
                });
                return 0;
            }
            if (!attributess) {
                attributess = [];
                // res.json({
                //     success: true,
                //     message: 'error!'
                // });
                // return 0;
            }
            // console.log(attributess);
            _.forEach(attributess, (c) => {
                c.name = c["name"][req.headers.lan];
                // console.log(c);
            });
            Attributes.countDocuments({}, function(err, count) {
                // console.log('countDocuments', count);
                if (err || !count) {
                    res.json({
                        success: false,
                        message: "error!"
                    });
                    return 0;
                }
                res.setHeader(
                    "X-Total-Count",
                    count
                );
                if (req.params.catId)
                    Attributes.findById(req.params.catId, function(err, mainCat) {
                        // console.log('here');
                        if (attributess && attributess.length >= 0) {
                            if (mainCat) {
                                mainCat.back = true;
                                mainCat.name = mainCat["name"][req.headers.lan];
                                attributess[attributess.length] = mainCat;
                            }
                        }
                        res.json(attributess.reverse());
                        return 0;
                    }).lean();
                else {
                    res.json(attributess.reverse());
                    return 0;
                }


            });

        }).skip(offset).sort({ _id: -1 }).limit(parseInt(req.params.limit));
    }
    ,
    sidebarS: function(req, res, next) {
        return new Promise(function(resolve, reject) {

            let offset = 0;
            if (req.params.offset) {
                offset = parseInt(req.params.offset);
            }

            let search = {};
            if (!req.params.catId) {
                search["parent"] = null;
            } else {
                search["parent"] = req.params.catId;
            }
            search["name." + req.headers.lan] = {
                $exists: true
            };
            // console.log('jhgfghj', search);
            Attributes.find(search, function(err, attributess) {
                if (err) {
                    resolve([]);
                    return 0;
                }
                if (!attributess) {
                    attributess = [];

                }
                _.forEach(attributess, (c) => {
                    c.name = c["name"][req.headers.lan];
                });
                Attributes.countDocuments({}, function(err, count) {
                    // console.log('countDocuments', count);
                    if (err || !count) {
                        res.json({
                            success: false,
                            message: "error!"
                        });
                        return 0;
                    }
                    res.setHeader(
                        "X-Total-Count",
                        count
                    );
                    if (req.params.catId)
                        Attributes.findById(req.params.catId, function(err, mainCat) {
                            // console.log('here');
                            if (attributess && attributess.length >= 0) {
                                if (mainCat) {
                                    mainCat.back = true;
                                    mainCat.name = mainCat["name"][req.headers.lan];
                                    attributess[attributess.length] = mainCat;
                                }
                            }
                            resolve(attributess.reverse());
                            return 0;
                        }).lean();
                    else {
                        resolve(attributess.reverse());
                        return 0;
                    }


                });

            }).skip(offset).sort({ _id: -1 }).limit(parseInt(req.params.limit));
        });
    }
    ,
    viewOne: function(req, res, next) {

        Attributes.findById(req.params.id,
            function(err, attributes) {
                if (err || !attributes) {
                    res.json({
                        success: false,
                        message: "error!"
                    });
                    return 0;
                }
                res.json(attributes);
                return 0;

            });
    }
    ,
    exparty: function(req, res, next) {

        res.json(s);
        return 0;

    }
    ,
    create: function(req, res, next) {
        console.log('creating attributes...', req.body);

        Attributes.create(req.body, function(err, attributes) {
            if (err || !attributes) {
                res.json({
                    err: err,
                    success: false,
                    message: "error!"
                });
                return 0;
            }
            res.json(attributes);
            return 0;

        });
    }
    ,
    destroy: function(req, res, next) {
        Attributes.findByIdAndDelete(req.params.id,
            function(err, attributes) {
                if (err || !attributes) {
                    res.json({
                        success: false,
                        message: "error!"
                    });
                    return 0;
                }
                res.json({
                    success: true,
                    message: "Deleted!"
                });
                return 0;


            }
        );
    }
    ,
    edit: function(req, res, next) {
        Attributes.findByIdAndUpdate(req.params.id, req.body, { new: true }, function(err, attributes) {
            if (err || !attributes) {
                res.json({
                    success: false,
                    message: "error!"
                });
                return 0;
            }

            res.json(attributes);
            return 0;

        });
    }
    ,
    count: function(req, res, next) {
        Attributes.countDocuments({}, function(err, count) {
            // console.log('countDocuments', count);
            if (err || !count) {
                res.json({
                    success: false,
                    message: "error!"
                });
                return 0;
            }

            res.json({
                success: true,
                count: count
            });
            return 0;


        });
    }



});
export default self;
