//npms
var express = require("express");
const multer = require("multer");
const fs = require("fs");
const Fuse = require("fuse.js");

const nodemailer = require("nodemailer");
const generateotp = require("otp-generator");
const mysql = require("mysql2");
const path = require("path");
const app = express();
const bcrypt = require("bcrypt");
//ejs
app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
//multer
const storage = multer.diskStorage({
  destination: "./public/uploads/",
  filename: (req, file, cb) => {
    cb(
      null,
      file.fieldname + "-" + Date.now() + path.extname(file.originalname)
    );
  },
});
const upload = multer({ storage });
//data base connection
const sqldb = mysql.createConnection({
  host: "aws.connect.psdb.cloud",
  user: "8qmxrbyjy8f63cgdyeh8",
  password: "pscale_pw_E0vKrHMAwgot07IJSXciKmlYDgzWPgbIKgtJf3XV65d",
  database: "uzhavanhouse",
});
sqldb.connect((err) => {
  if (err) {
    console.error(err);
  } else {
    console.log("Connection established");
  }
});
//server start  
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
}).listen(8080);
//user signed up
app.get("/signup", (req, res) => {
  res.sendFile(__dirname + "/signup.html");
});
app.post("/signup", async (req, res) => {
  var name = req.body.name;
  var phno = req.body.phno;
  var address = req.body.address;
  var pincode = req.body.pincode;
  var email = req.body.email;
  const hashedpassword = await bcrypt.hash(req.body.password, 10);
  sqldb.connect();
  {
    const checkQuery = `SELECT * FROM userdetails WHERE email = ?`;
    sqldb.query(checkQuery, [email], (error, results) => {
      if (error) {
        throw error;
      }
      if (results.length > 0) {
        res.sendFile(__dirname+"/404.html");
      } else {
        var Query = "SELECT id FROM userdetails ORDER BY id DESC LIMIT 1;";
        sqldb.query(Query, function (error, result) {
          if (error) throw error;
          var firstElement = result[0];
          var no = firstElement.id;
          var id = no + 1;
          var sql =
            "INSERT INTO userdetails(id,name,email,password,phno,address,pincode) VALUES('" +
            id +
            "','" +
            name +
            "','" +
            email +
            "','" +
            hashedpassword +
            "','" +
            phno +
            "','" +
            address +
            "','" +
            pincode +
            "')";
          sqldb.query(sql, function (error) {
            if (error) throw error;
            console.log("user added");
            res.redirect(`/user/${encodeURIComponent(email)}`);
          });
        });
      }
    });
  }
});
//user login
app.get("/userlogin", (req, res) => {
  res.sendFile(__dirname + "/login.html");
});
app.post("/login", async (req, res) => {
  const Email = req.body.email;
  const password = req.body.password;

  const query = "SELECT * FROM userdetails WHERE email = ?";
  sqldb.query(query, [Email], (error, results) => {
    if (error) {
      console.error("Error executing the query:", error);
      return;
    }
    if (results.length === 1) {
      const user = results[0];
      bcrypt.compare(password, user.password, (bcryptError, isMatch) => {
        if (bcryptError) {
          console.error("Error comparing passwords:", bcryptError);
          return;
        }
        if (isMatch) {
          console.log("Login successful.");
          res.redirect(`/user/${encodeURIComponent(Email)}`);
        } else {
          res.send(`
            <script>
            alert('Invalid username or password');
            window.location.href = '/userlogin';
            </script>
          `);
          console.log("Invalid username or password.");
        }
      });
    } else {
      res.send(`
        <script>
        alert('Invalid username');
        window.location.href = '/userlogin';
        </script>
      `);
      console.log("Invalid username or password.");
    }
  });
});
//user forget password
app.get("/forget", (req, res) => {
  s = false;
  res.render("forget", { s });
});
app.post("/forget", (req, res) => {
  const email = req.body.email;
  const otp = genotp();

  userCredentials[email] = { otp };
  sendOTPByEmail(email, otp);
  console.log("OTP generated and sent successfully");
  s = true;
  res.render("forget", { s });
});
//user verify otp
app.post("/verify", async (req, res) => {
  const otp = req.body.otp;
  const newpassword = req.body.password;
  const email = req.body.email;

  const storedCredentials = userCredentials[email];
  if (!storedCredentials || storedCredentials.otp !== otp) {
    res.send(
      `<script>
alert('Invalid inputs');
window.location.href = '/forget';
</script>`
    );
    return;
  }
  sqldb.connect();
  {
    const hashedpassword = await bcrypt.hash(newpassword, 10);
    const updateQuery = "UPDATE userdetails SET password = ? WHERE email = ?";
    sqldb.query(updateQuery, [hashedpassword, email], (error) => {
      if (error) {
        console.error("Error updating password:", error);
        return;
      }
    });
  }
  res.send(
    `<script>
alert('password updated');
window.location.href = '/userlogin';
</script>`
  );
});
//user page
app.get("/user/:email",function (req, res)  {
  const email = req.params.email;
  const productarray = [];
  const imagearray = [];
  const a = "SELECT pincode FROM userdetails WHERE email= ?";
  sqldb.query(a, [email], function (err, result) {
    if (err) throw err;
    if (result && result.length > 0) {
      var t = result;
      var pincode = t[0].pincode;
      const s = "SELECT storeid FROM store WHERE pincode=?";
      sqldb.query(s, [pincode], function (err, result) {
        if (err) throw err;
        (async () => {
          try {
            for (const store of result) {
              const storeId = store.storeid;
              const storeQuery =
                "SELECT storeid, productid, imageid, imagepath FROM images WHERE storeid = ?";
              const imge = await new Promise((resolve, reject) => {
                sqldb.query(storeQuery, [storeId], function (err, result) {
                  if (err) reject(err);
                  else resolve(result);
                });
              });
              imagearray.push(...imge);
              const Query =
                "SELECT productid, productName, productType, productDescription, mrp, sellingPrice, expiryDays, storeid FROM products WHERE storeid = ?";
              const products = await new Promise((resolve, reject) => {
                sqldb.query(Query, [storeId], function (err, result) {
                  if (err) reject(err);
                  else resolve(result);
                });
              });
              productarray.push(...products);
            }
            const sm = true;
            res.render("user", {
              products: productarray,
              images: imagearray,
              email: email,
              pincode: pincode,
              s: sm,
            });
          } catch (error) {
            console.error(error);
          }
        })();
      });
    }
  });
});
//user filter
app.post("/filter/:email", (req, res) => {
  
  product = req.body.product;
  productType= req.body.productType;
  if (!product && !productType) {
    const email = req.params.email;
    const pincode = req.body.pincode
    const productarray = [];
    const imagearray = [];
    const s = "SELECT storeid FROM store WHERE pincode=?";
    sqldb.query(s, [pincode], function (err, result) {
      if (err) throw err;
      (async () => {
        try {
          for (const store of result) {
            const storeId = store.storeid;
      const storeQuery ="SELECT storeid, productid, imageid, imagepath FROM images WHERE storeid = ?";
            const imge = await new Promise((resolve, reject) => {
              sqldb.query(storeQuery, [storeId], function (err, result) {
                if (err) reject(err);
                else resolve(result);
              });
            });
            imagearray.push(...imge);
            const Query =
              "SELECT productid, productName, productType, productDescription, mrp, sellingPrice, expiryDays, storeid FROM products WHERE storeid = ?";
            const products = await new Promise((resolve, reject) => {
              sqldb.query(Query, [storeId], function (err, result) {
                if (err) reject(err);
                else resolve(result);
              });
            });
            productarray.push(...products);
          }
          sm = true;
          res.render("user", {
            products: productarray,
            images: imagearray,
            email: email,
            pincode: pincode,
            s: sm,
          });
        } catch (error) {
          console.error(error);
        }
      })();
    });
  } else if(!productType) {
    const email = req.params.email;
    const pincode = req.body.pincode;
    const productarray = [];
    const imagearray = [];
    let finalresult = [];
    const s = "SELECT storeid FROM store WHERE pincode=?";
    sqldb.query(s, [pincode], function (err, result) {
      if (err) throw err;
      console.log(result);
      (async () => {
        try {
          for (const store of result) {
            const storeId = store.storeid;
            const storeQuery =
              "SELECT storeid, productid, imageid, imagepath FROM images WHERE storeid = ?";
            const imge = await new Promise((resolve, reject) => {
              sqldb.query(storeQuery, [storeId], function (err, result) {
                if (err) reject(err);
                else resolve(result);
              });
            });
            imagearray.push(...imge);
            const Query =
              "SELECT productid, productName, productType, productDescription, mrp, sellingPrice, expiryDays, storeid FROM products WHERE storeid = ?";
            const products = await new Promise((resolve, reject) => {
              sqldb.query(Query, [storeId], function (err, result) {
                if (err) reject(err);
                else resolve(result);
              });
            });
            productarray.push(...products);
          }
          const productIds = [];
          const productNames = [];
          for (const pro of productarray) {
            productIds.push(pro.productid);
            productNames.push(pro.productName);
          }
          const arr = [];
          const options = {
            includeScore: true,
            threshold: 0.4,
          };
          const fuse = new Fuse(productNames, options);
          const searchwords = fuse.search(product);
          if (searchwords.length > 0) {
            for (const pros of searchwords) {
              arr.push(pros.refIndex);
            }
            const ans = arr.map((index) => productIds[index]);
            const finalresult = productarray.filter((obj) =>
              ans.includes(obj.productid)
            );

            const sm = true;
            res.render("user", {
              products: finalresult,
              images: imagearray,
              email: email,
              pincode: pincode,
              s: sm,
            });
          } else {
            const sm = false;
            res.render("user", {
              products: finalresult,
              images: imagearray,
              email: email,
              pincode: pincode,
              s: sm,
            });
            console.log("No similar string found");
          }
        } catch (error) {
          console.error(error);
        }
      })();
    });
  }else
  {
    const email = req.params.email;
    const pincode = req.body.pincode;
    const productarray = [];
    const imagearray = [];
    let finalresult = [];
    const s = "SELECT storeid FROM store WHERE pincode=?";
    sqldb.query(s, [pincode], function (err, result) {
      if (err) throw err;
      console.log(result);
      (async () => {
        try {
          for (const store of result) {
            const storeId = store.storeid;
            const storeQuery =
              "SELECT storeid, productid, imageid, imagepath FROM images WHERE storeid = ?";
            const imge = await new Promise((resolve, reject) => {
              sqldb.query(storeQuery, [storeId], function (err, result) {
                if (err) reject(err);
                else resolve(result);
              });
            });
            imagearray.push(...imge);
            const Query =
              "SELECT productid, productName, productType, productDescription, mrp, sellingPrice, expiryDays, storeid FROM products WHERE storeid = ? AND productType=?";
            const products = await new Promise((resolve, reject) => {
              sqldb.query(Query, [storeId,productType], function (err, result) {
                if (err) reject(err);
                else resolve(result);
              });
            });
            productarray.push(...products);
          }
          console.log(productarray);
          if (productarray.length > 0) {
            const sm = true;
            res.render("user", {
              products: productarray,
              images: imagearray,
              email: email,
              pincode: pincode,
              s: sm,
            });
          } else {
            const sm = false;
            res.render("user", {
              products: finalresult,
              images: imagearray,
              email: email,
              pincode: pincode,
              s: sm,
            });
            console.log("No similar string found");
          }
        } catch (error) {
          console.error(error);
        }
      })();
    });
  }
});
//user view induvidual product
app.get("/userproduct/:productid", (req, res) => {
  const productid = req.params.productid;
  s = `SELECT imagepath,storeid from images where productid=?`;
  sqldb.query(s, [productid], function (err, result) {
    if (err) throw err;
    const image = result;
    const a = image[0].storeid;
    ww = "Select phno,address from store WHERE storeid=?";
    sqldb.query(ww, [a], function (err, result) {
      if (err) throw err;
      phno = result[0].phno;
      address=result[0].address;
      w = `SELECT * FROM products WHERE productid=?`;
      sqldb.query(w, [productid], function (err, result) {
        if (err) throw err;
        for (const s of result) {
          const dateString = s.expiryDays;
          const date = new Date(dateString);
          const formattedDate = date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          });
          s.expiryDays = formattedDate;
        }
        
        res.render("product", { product: result[0], image: image, phno: phno,address:address });
      });
    });
  });
});
//user update profile
app.get("/userprofileupdate/:email", (req, res) => {
  var email = req.params.email;
  const checkQuery = `SELECT * FROM userdetails WHERE email = ?`;
  sqldb.query(checkQuery, [email], (error, results) => {
    if (error) {
      throw error;
    }
    var i = results[0];
    res.render("userprofile", {
      name: i.name,
      email: i.email,
      phno: i.phno,
      address: i.address,
      pincode: i.pincode,
    });
  });
});
app.post("/userchanges", (req, res) => {
  var name = req.body.name;
  var phno = req.body.phno;
  var address = req.body.address;
  var pincode = req.body.pincode;
  var email = req.body.email;
  const sql = `
  UPDATE userdetails
  SET name = ?,
      address = ?,
      phno = ?,
      pincode = ?
  WHERE email = ?
`;
  sqldb.query(sql, [name, address, phno, pincode, email], function (err) {
    if (err) throw err;
  });

  res.send(`
<script>
alert('details updated successfully');
window.location.href = '/user/${email}';
</script>
`);
});
///



///
//seller login
app.get("/storelogin", function (req, res) {
  res.sendFile(__dirname + "/store.html");
});
app.post("/storelogin", function (req, res) {
  const Email = req.body.phno;
  const password = req.body.password;
  const query = "SELECT * FROM store WHERE email = ?";
  sqldb.query(query, [Email], (error, results) => {
    if (error) {
      console.error("Error executing the query:", error);
      return;
    }
    if (results.length === 1) {
      const user = results[0];
      bcrypt.compare(password, user.password, (bcryptError, isMatch) => {
        if (bcryptError) {
          console.error("Error comparing passwords:", bcryptError);
          return;
        }
        if (isMatch) {
          console.log("Login successful.");
          const checkQuery = `SELECT * FROM store WHERE email = ?`;
          sqldb.query(checkQuery, [Email], (error) => {
            if (error) {
              throw error;
            }
          });

          var i = results[0];
          var id = i.storeid;
    
          const redirectUrl = `/seller?value1=${encodeURIComponent(
            Email
          )}&value2=${encodeURIComponent(id)}`;
          res.redirect(redirectUrl);
        } else {
          res.send(`
            <script>
            alert('Invalid password');
            window.location.href = '/storelogin';
            </script>
          `);
          console.log("Invalid username or password.");
        }
      });
    } else {
      res.send(`
        <script>
        alert('Invalid username');
        window.location.href = '/storelogin';
        </script>
      `);
      console.log("Invalid username or password.");
    }
  });
});
//seller signup
app.get("/storesignup", function (req, res) {
  res.sendFile(__dirname + "/storesignup.html");
});
app.post("/storesignup", async function (req, res) {
  var name = req.body.name;
  var phno = req.body.phno;
  var address = req.body.address;
  var pincode = req.body.pincode;
  var email = req.body.email;

  const hashedpassword = await bcrypt.hash(req.body.password, 10);
  sqldb.connect();
  {
    const checkQuery = `SELECT * FROM store WHERE email = ?`;
    sqldb.query(checkQuery, [email], (error, results) => {
      if (error) {
        throw error;
      }
      if (results.length > 0) {
        return res.status(400).send("email already registered");
      } else {
        var Query = "SELECT storeid FROM store ORDER BY storeid DESC LIMIT 1;";
        sqldb.query(Query, function (error, result) {
          if (error) throw error;
          var firstElement = result[0];
          var no = firstElement.storeid;
          var id = no + 1;
          var sql =
            "INSERT INTO store(storeid,name,email,password,phno,address,pincode) VALUES('" +
            id +
            "','" +
            name +
            "','" +
            email +
            "','" +
            hashedpassword +
            "','" +
            phno +
            "','" +
            address +
            "','" +
            pincode +
            "')";
          sqldb.query(sql, function (error) {
            if (error) throw error;
          
            const redirectUrl = `/seller?value1=${encodeURIComponent(
              email
            )}&value2=${encodeURIComponent(id)}`;
            res.redirect(redirectUrl);
          });
        });
      }
    });
  }
});
//seller forgot password
app.get("/storeforget", (req, res) => {
  s = false;
  res.render("storeforget", { s });
});
app.post("/storeforget", (req, res) => {
  const email = req.body.email;
  const otp = genotp();

  userCredentials[email] = { otp };
  sendOTPByEmail(email, otp);
  console.log("OTP generated and sent successfully");

  s = true;
  res.render("storeforget", { s });
});
//seller otp verify
app.post("/storeverify", async (req, res) => {
  const otp = req.body.otp;
  const newpassword = req.body.password;
  const email = req.body.email;

  const storedCredentials = userCredentials[email];
  if (!storedCredentials || storedCredentials.otp !== otp) {
    res.send(
      `<script>
alert('Invalid inputs');
window.location.href = '/storeforget';
</script>`
    );
    return;
  } else {
    sqldb.connect();
    {
      const hashedpassword = await bcrypt.hash(newpassword, 10);
      const updateQuery = "UPDATE store SET password = ? WHERE email = ?";
      sqldb.query(updateQuery, [hashedpassword, email], (error) => {
        if (error) {
          console.error("Error updating password:", error);
          return;
        }
        res.send(
          `<script>
        alert('password updated');
        window.location.href = '/storelogin';
        </script>`
        );
      });
    }
  }
});
// seller dashboard
app.get("/seller", (req, res) => {
  const Email = req.query.value1;
  const id = req.query.value2;
  res.render("storeproduct", { email: Email, id: id });
});
//seller  update profile
app.get("/profile/:email", (req, res) => {
  var email = req.params.email;
  const checkQuery = `SELECT * FROM store WHERE email = ?`;
  sqldb.query(checkQuery, [email], (error, results) => {
    if (error) {
      throw error;
    }
    var i = results[0];
    res.render("storeprofile", {
      name: i.name,
      email: i.email,
      phno: i.phno,
      address: i.address,
      pincode: i.pincode,
    });
  });
});
app.post("/changes", (req, res) => {
  var name = req.body.name;
  var phno = req.body.phno;
  var address = req.body.address;
  var pincode = req.body.pincode;
  var email = req.body.email;
  const sql = `
  UPDATE store
  SET name = ?,
      address = ?,
      phno = ?,
      pincode = ?
  WHERE email = ?
`;
  sqldb.query(sql, [name, address, phno, pincode, email], function (err) {
    if (err) throw err;
  });
  const checkQuery = `SELECT * FROM store WHERE email = ?`;
  sqldb.query(checkQuery, [email], (error, results) => {
    if (error) {
      throw error;
    }
    var i = results[0];
    var id = i.storeid;
    res.send(`
<script>
alert('details updated successfully');
window.location.href = '/seller?value1=${encodeURIComponent(
      email
    )}&value2=${encodeURIComponent(id)}';
</script>
`);
  });
});
//seller add product
app.get("/addproduct/:id/:reciveemail", (req, res) => {
  var id = req.params.id;
  var email = req.params.reciveemail;

  res.render("add-product", { id: id, email: email });
});
app.post("/products/add/:id/:email", upload.array("photos", 10), (req, res) => {
  var email = req.params.email;
  var storeid = req.params.id;
  var query = "SELECT productid FROM products ORDER BY productid DESC LIMIT 1;";
  sqldb.query(query, function (error, result) {
    if (error) throw error;
    var firstElement = result[0];
    var no = firstElement.productid; // Assuming the column name is 'productid'
    var id = no + 1;
    const {
      productName,
      productType,
      productDescription,
      mrp,
      sellingPrice,
      expiryDays,
    } = req.body;

    sqldb.query(
      "INSERT INTO products (productid, storeid, productName, productType, productDescription, mrp, sellingPrice, expiryDays) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [
        id,
        storeid,
        productName,
        productType,
        productDescription,
        mrp,
        sellingPrice,
        expiryDays,
      ],
      async (err) => {
        if (err) throw err;
        console.log("Product added successfully");
        const photos = req.files.map((file) => file.filename);
        var query = "SELECT id FROM images ORDER BY id DESC LIMIT 1;";
        sqldb.query(query, function (error, result) {
          if (error) throw error;
          var first = result[0];
          var noo = first.id;
          noo++;
          for (let i = 0; i < photos.length; i++) {
            sqldb.query(
              "INSERT INTO images (id, productid, storeid, imageid, imagepath) VALUES (?, ?, ?, ?, ?)",
              [noo, id, storeid, i, photos[i]],
              (err) => {
                if (err) throw err;
              }
            );
            noo++;
          }
        });
      }
    );
    res.send(`
              <script>
                alert('Product added');
                window.location.href = '/seller?value1=${encodeURIComponent(
                  email
                )}&value2=${encodeURIComponent(storeid)}';
              </script>
            `);
  });
});
//seller show added product
app.get("/products/:id/:email", (req, res) => {
  var storeid = req.params.id;
  const storeQuery =
    "SELECT storeid,productid,imageid,imagepath  FROM images WHERE storeid = ?";
  sqldb.query(storeQuery, [storeid], function (err, result) {
    if (err) throw err;
    var imge = result;
    const Query =
      "SELECT productid, productName,productType,productDescription,mrp,sellingPrice,expiryDays,storeid  FROM products WHERE storeid = ?";
    sqldb.query(Query, [storeid], function (err, result) {
      if (err) throw err;
      res.render("storelist", { products: result, images: imge });
    });
  });
});
//seller edit updated product
app.get("/editproduct/:id", (req, res) => {
  var productid = req.params.id;
  const storeQuery =
    "SELECT storeid,productid,imageid,imagepath  FROM images WHERE productid = ?";
  sqldb.query(storeQuery, [productid], function (err, result) {
    if (err) throw err;
    var imge = result;
    const Query =
      "SELECT productid, productName,productType,productDescription,mrp,sellingPrice,expiryDays  FROM products WHERE productid = ?";
    sqldb.query(Query, [productid], function (err, result) {
      if (err) throw err;
      for (const s of result) {
        const dateString = s.expiryDays;
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        const formattedDate = `${year}/${month}/${day}`;
        s.expiryDays = formattedDate;
      }
      res.render("editproduct", { product: result[0], images: imge });
    });
  });
});
app.post("/editproduct/:id", (req, res) => {
  var productid = req.params.id;
  const productName = req.body.productName;
  const productType = req.body.productType;
  const productDescription = req.body.productDescription;
  const mrp = req.body.mrp;
  const sellingPrice = req.body.sellingPrice;
  const expiryDays = req.body.expiryDays;
  const updateQuery =
    "UPDATE products SET productName = ?, productType = ?, productDescription = ?, mrp = ?, sellingPrice = ?, expiryDays = ? WHERE productid = ?";
  const values = [
    productName,
    productType,
    productDescription,
    mrp,
    sellingPrice,
    expiryDays,
    productid,
  ];
  s = "SELECT storeid FROM products WHERE productid = ?";
  sqldb.query(s, [productid], function (err, result) {
    if (err) throw err;
    storeid = result[0].storeid;
    sqldb.query(updateQuery, values, function (err) {
      if (err) throw err;
      console.log("Updated");
      res.send(`
<script>
alert('Value updated successfully');
window.location.href = 'http://localhost:3000/products/${storeid}/${storeid}';
</script>
`);
    });
  });
});
//other functions
// function ensuretoken(req,res,next) {
//   const b=req.header('authorization');
//   if(typeof b !=='undefined') {
//     const barear=b.split(" ");
//     const bt=barear[1];
//     req.token = b;
//     next();
//   }
//   else{
//     res.send(403)
//   }
// }

const userCredentials = {};
function sendOTPByEmail(email, otp) {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "20tuec216@skct.edu.in",
      pass: "srikanth@2003",
    },
  });
  const mailOptions = {
    from: "20tuec216@skc.edu.in",
    to: email,
    subject: "OTP Verification",
    text: `Your OTP: ${otp}`,
  };
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log("Error sending email:", error);
    } else {
      console.log("Email sent:", info.response);
    }
  });
}
function genotp() {
  const otp = generateotp.generate(6, {
    digits: true,
    alphabets: false,
    upperCaseAlphabets: false,
    lowerCaseAlphabets: false,
    specialChars: false,
  });
  return otp.toString();
}
// function myFunction() {
//   const currentDate = new Date().toISOString().split("T")[0];
//   const s = `SELECT productid FROM products WHERE expiryDays < '${currentDate}'`;
//   sqldb.query(s, function (err, result) {
//     for (const store of result) {
//       const storeId = store.productid;
//       const img = `SELECT imagepath FROM images WHERE productid=?`;
//       sqldb.query(img, [storeId], function (err, result) {
//         if (err) throw err;
//         var mm = result;
//         for (const nn of mm) {
//           const imgpath = nn.imagepath;
//           const filePath =
//             "C:\\Users\\HP\\Desktop\\agri.com\\public\\uploads\\";
//           const fileName = imgpath;
//           const fullPath = path.join(filePath, fileName);

//           fs.unlink(fullPath, (err) => {
//             if (err) {
//               console.error("Error deleting file:", err);
//             } else {
//               console.log("File deleted successfully.");
//             }
//           });
//         }
//       });
//       const c = `DELETE FROM images WHERE productid=?`;
//       sqldb.query(c, [storeId], function (err) {
//         if (err) throw err;
//       });
//     }
//   });
//   const query = `DELETE FROM products WHERE expiryDays < '${currentDate}'`;
//   sqldb.query(query, (err, result) => {
//     if (err) {
//       console.error("Error removing expired products:", err);
//     } else {
//       console.log("Expired products removed:", result.affectedRows);
//     }
//   });
// }
// myFunction();
// const oneDayInMilliseconds = 24 * 60 * 60 * 1000;
// setTimeout(myFunction, oneDayInMilliseconds);
