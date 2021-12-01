const express = require('express');
const app = express();
var bodyParser = require('body-parser');
var cors = require('cors');
app.use(express.json());
var mysql = require('mysql')
app.use(cors());

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true,
    limit: '150mb'
}));
const multer =require('multer');
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, '../skytheme/src/assets/images')
    },
    filename: function (req, file, cb) {
        const mimeExtension = {
            'image/jpeg': 'jpeg',
            'image/jpg': 'jpg',
            'image/png': 'png',
            'image/gif': 'gif',
        }
        const uniqueSuffix = Date.now() + file.originalname
        cb(null, file.fieldname + '-' + uniqueSuffix, mimeExtension[file.mimetype]);
    }

})
const uploadImage = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/jpg' || file.mimetype === 'image/png' || file.mimetype === 'image/gif') {
            cb(null, true);
        } else {
            cb(null, false);
            req.error = "File format is not valid"
        }
    }
})

const upload = multer({ storage: storage, limits: { fileSize: 1024 * 1024 * 5 } })
var dbconn = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'skytheme'
});
dbconn.connect();
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

app.get('/', function (req, res) {
    return res.send({ error: true, massage: "get data" })
})

// admin login
app.post('/adminlogin',function(req, res){
    var username = req.body.username;
    var password = req.body.password;
    console.log("username and password", username,password);
    dbconn.query('SELECT id, username, password FROM adminlogin where username = ? AND password = ?',[username, password], 
    function(error, results, fields){
        if(error) throw error;
        console.log(results[0])
        if(results[0] != null){
            return res.send({error : false, data : results[0], massage: results[0].id});
        }
        else{
            return res.send({error : true, massage: "Provide correct data", status: 201})
        }
    })
}) 

// post product
app.post('/postProduct', function(req, res){
    var productName = req.body.productName;
    var productDescription = req.body.productDescription;
    var productImage = req.body.productImage;
    var productPrice = req.body.productPrice;
    var productSize = req.body.productSize;
    var productBrand = req.body.productBrand;
    var productSpecification = req.body.productSpecification;
    var categoryid = req.body.categoryid;
    console.log("Data", productName,productDescription,productImage,productPrice,productSize,productBrand, productSpecification,categoryid);
    if(!productName && !productDescription && !productImage &&!productPrice && !productSize && !productBrand && !productSpecification && !categoryid){
        res.send({error: true, massage: "Please providee complete data"});
    }
    dbconn.query("INSERT INTO product (productName,productDescription,productImage,productPrice,productSize,productBrand, productSpecification,categoryid) VALUES (?,?,?,?,?,?,?,?)", 
    [productName,productDescription,productImage,productPrice,productSize,productBrand, productSpecification,categoryid],
    function(error, results, fields){
        if (error) throw error;
        res.send({error: false,data: results, massage: "Data posted successfully"});
    })
})
// get image
app.get('/getimage', function(req, res){
    dbconn.query("SELECT * from image", function(error, results, fields){
        if(error) throw error;
        return res.send({error: false, data: results, massage: "Get data successfully"}) 
    })
})

//get category
app.get('/getCategory', function(req, res){
    dbconn.query("SELECT image.id,image.imagename,image.imagepath, admincategory.id,admincategory.category,admincategory.parentcategory,admincategory.is_active,admincategory.imageid FROM admincategory LEFT JOIN image ON admincategory.imageid = image.id",
    function(error, results,fields){
        if (error) throw error;
        res.send({error: false, data: results, massage: "Get data successfully"});
    })
})

// get product
app.get('/getProduct', function(req, res) {
dbconn.query('SELECT image.id, image.imagename,image.imagepath, product.id, product.productName,product.productDescription,product.productImage,product.productPrice,product.productSize,product.productBrand, product.productSpecification,product.categoryid FROM product LEFT JOIN image ON product.productImage = image.id',
    function(error, results, fields){
        if(error) throw error;
        res.send({error: false, data: results, massage: 'Get data successfully'});
    })
})

// post image
app.post('/postImage', upload.single('imagepath'), function (req, res) {
    // var fileInfo = req.file.filename;
    console.log(req.file, "request file");
    var imagename = req.body.imagename;
    var imagepath = req.file.filename;
    console.log("Data", imagename, imagepath);
    // console.log("file info", fileInfo)
    if (!imagename && !imagepath) {
        return res.send({ error: true, massage: "Please provide image data" })
    }
    dbconn.query('INSERT into image (imagename, imagepath) VALUES (?,?)', [imagename, imagepath], function (error, results, fields) {
        if (error) throw error;
        return res.send({ error: false, data: results, massage: "Posted successfully" })
    })
})

// delete image
app.delete('/deleteimage/:id', function(req, res){
    let id = req.params.id;
    console.log("id", id);
    if(!id){
        res.status(400).send({error: true, massage: " Please provide id"});
    }
    dbconn.query("DELETE from image WHERE id = (?)", id, function(error, results, fields){
        if (error) throw error;
        res.send({error: false, data: results, massage: " Data deleted successfully"});
    })
})

//delete category
app.delete('/deleteCategory/:id', function(req, res){
    let id = req.params.id;
    console.log("id", id);
    if(!id){
        res.status(400).send({error: true, massage: "Please provide id "});
    }
    dbconn.query('DELETE FROM admincategory WHERE id = (?)', id, function(error, results, fields){
        if (error) throw error;
        res.send({error: false, data: results, massage: "Deleted successfully"});
    })
})

// delete product
app.delete('/deleteProduct/:id', function(req, res){
    var id = req.params.id;
    console.log("id", id);
    if(!id){
        res.status(400).send({error: true, massage: "Please provide id"});
    }
    dbconn.query("DELETE FROM product WHERE id = (?)", id, function(error, results, fields){
    if (error) throw error;
        res.send({error: false, data: results, massage:"Data deleted successfully"});
    })
})


//post category
app.post('/postCategory', function(req,res){
    let category = req.body.category;
    let parentcategory = req.body.parentcategory;
    let is_active = req.body.is_active;
    let imageid = req.body.imageid;
    console.log("Data", category, parentcategory, is_active, imageid);
    if(!category && !parentcategory && !is_active && !imageid){
        return res.send({error: true, massage: "Please provide complete data"});
    }
    dbconn.query("INSERT INTO admincategory (category, parentcategory, is_active, imageid) VALUES (?,?,?,?)",[category, parentcategory, is_active, imageid],
    function(error, results, fields){
        if (error) throw error;
        return res.send({error: false, data: results, massage: "Data posted successfully"});
    })
})

// Update category
app.put('/updateCategory/:id', function(req, res){
    let id = req.params.id;
    let category = req.body.category;
    let parentcategory = req.body.parentcategory;
    let is_active = req.body.is_active;
    let imageid = req.body.imageid;
    console.log("Data", category, parentcategory, is_active, imageid);
    if(!category && !parentcategory && !is_active && !imageid){
        res.status(404).send({error: true, massage: "Data not updated"});
    }
    dbconn.query("UPDATE admincategory SET category = ?, parentcategory = ?, is_active = ?, imageid = ? WHERE id = ?",[category, parentcategory, is_active, imageid, id],
    function(error, results, fields){
        if (error) throw error;
        res.send({error: false, data: results, massage: "Data updated successfully"});
    })
})

//update product
app.put('/updateProduct/:id', function(req, res){
    let id = req.params.id;
    let productName = req.body.productName;
    let productDescription = req.body.productDescription;
    let productImage = req.body.productImage;
    let productPrice = req.body.productPrice;
    let productSize = req.body.productSize;
    let productBrand = req.body.productBrand;
    let productSpecification = req.body.productSpecification;
    let categoryid = req.body.categoryid;
    console.log("Data", productName, productDescription, productImage, productPrice, productSize,productBrand, productSpecification, categoryid);
    if(productName && productDescription && productImage && productPrice && productPrice && productSize  && productBrand && productSpecification && categoryid){
        dbconn.query("UPDATE product SET productName = ?, productDescription = ?, productImage = ?, productPrice = ?,productSize = ?, productBrand = ?, productSpecification = ?, categoryid= ? WHERE id = ?",
        [productName, productDescription, productImage, productPrice, productSize, productBrand, productSpecification, categoryid, id],function(error, results, fields){
            if(error) throw error;
            res.send({error: false, data: results, massage: "Data updated successfully"});
        })
    }
    else{
        res.status(404).send({error: true, massage: "Data not updated"});
}
})


// app listen
app.listen(8080, function () {
    console.log('Node app is running on port 8080');
});
module.exports = app;