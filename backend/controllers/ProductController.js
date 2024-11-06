const Product = require('../models/Product');
const OrderItem = require('../models/OrderItem');

exports.addProduct = async (req, res) => {
  try {
    const newProduct = new Product(req.body);
    await newProduct.save();

    // Émettre l'événement pour informer les clients connectés qu'un nouveau produit a été ajouté
    req.io.emit('newProduct', newProduct);
    io.emit('newactiveProducts', );
    res.status(201).json(newProduct);
  } catch (err) {
    res.status(500).json({ message: 'Failed to add product', error: err });
  }
};
exports.sendActiveProducts = async (socket, serviceName) => {
  try {
    // Fetch all active products based on the service type
    const products = await Product.find({ is_active: true, service_type: serviceName });
    
    // Emit the active products back to the client
    socket.emit('activeProducts', { products });

    // Optional: Handle socket disconnection if needed
 

  } catch (err) {
    // Handle errors by emitting an error message via socket
    socket.emit('error', { message: 'Failed to retrieve products', error: err });
  }
};
exports.getProducts =  async (req, res) => {
  try {
    const products = await Product.find(); // Fetch all products
    res.json(products);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

exports.addProductA = async (req, res) => {
  try {
    const newProduct = new Product(req.body); // Create a new Product instance using the request body data
    await newProduct.save(); // Save the new product to the database


    const { io } = require('../index');
    const products = await Product.find();
    io.emit('productsUpdated', { products });
    io.emit('newactiveProducts', );
    // Return the newly created product as a JSON response
    res.status(201).json(newProduct);

  } catch (err) {
    // Handle any errors and return a 500 status with the error message
    res.status(500).json({ message: 'Failed to add product', error: err });
  }
};


exports.updateProduct = async (req, res) => {
  try {
    const { productId } = req.params; // Get product ID from the request params
    const updateData = req.body; // The updated product data from the client (React Native app)

    // Find the product by ID and update it with the new data
    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      { $set: updateData }, // Set the updated fields
      { new: true, runValidators: true } // Return the updated product, and run schema validators
    );

    // If the product is not found
    if (!updatedProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const { io } = require('../index');
    const products = await Product.find();
    io.emit('productsUpdated', { products });
    io.emit('newactiveProducts', );
    // Send the updated product back to the client
    res.status(200).json(updatedProduct);
  } catch (err) {
    console.error('Error updating product:', err);
    res.status(500).json({ message: 'Failed to update product', error: err.message });
  }
};





exports.deleteProduct = async (req, res) => {
  try {
    const productId = req.params.id;

    // Find the product by ID and delete it
    const deletedProduct = await Product.findByIdAndDelete(productId);

    if (!deletedProduct) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    const { io } = require('../index');
    const products = await Product.find();
    io.emit('productsUpdated', { products });
    io.emit('newactiveProducts', );
    res.status(200).json({ message: 'Product deleted successfully.', product: deletedProduct });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ message: 'Server error. Could not delete product.' });
  }
};



exports.getProductRevenueAndCountBetweenDates  = async (req , res) => {
  const { productId, startDate, endDate } = req.body; // Or req.query, depending on how you're sending data
 console.log(productId, startDate, endDate) 
  try {
    // Step 1: Aggregate data from OrderItem to calculate revenue and total times bought for a specific product within a date range
    const orderItems = await OrderItem.aggregate([
      {
        $lookup: {
          from: 'orders', // The collection name for 'Order' should be 'orders' in MongoDB
          localField: 'Order_id',
          foreignField: '_id',
          as: 'orderDetails'
        }
      },
      {
        $unwind: '$orderDetails' // Unwind the order details array
      },
      {
        $match: {
          'orderDetails.status': 'delivered', // Only include delivered orders
          'orderDetails.created_at': { 
            $gte: new Date(startDate), // Orders created on or after startDate
            $lte: new Date(endDate)    // Orders created on or before endDate
          },
        }
      },
      {
        $group: {
          _id: "$product_id",
          totalTimesBought: { $sum: "$quantity" }, // Sum of quantities for the product
          totalRevenue: { $sum: { $multiply: ["$price", "$quantity"] } }, // Sum of revenue (price * quantity)
        }
      }
    ]);
    
    // Step 2: Fetch the specific product
    const product = await Product.findById(productId);
    var myItem = {}
    orderItems.map(num => {
    if (num._id == product._id.toString() ) {
      myItem =  num; // Return the number (or something else if needed)
    }
  });
  console.log(myItem)
    // Step 3: Combine the data, setting revenue and total times bought to 0 if no orders exist for this product
    const productWithStats = {
      totalTimesBought: myItem ? myItem.totalTimesBought : 0,
      totalRevenue: myItem ? myItem.totalRevenue : 0
    };

   
    return res.status(200).json(productWithStats);
  } catch (err) {
    console.error('Error fetching product stats:', err);
    return res.status(500).json({ error: 'Error fetching product stats' });
  }
};




exports.getAllProductRevenueAndCountBetweenDates  = async (req , res) => {
  const {  startDate, endDate } = req.query; // Or req.query, depending on how you're sending data
 
 try {
  // Step 1: Aggregate data from OrderItem to calculate revenue and total times bought for each product
  const orderItems = await OrderItem.aggregate([
    {
      $lookup: {
        from: 'orders', // The collection name for 'Order' should be 'orders' in MongoDB
        localField: 'Order_id',
        foreignField: '_id',
        as: 'orderDetails'
      }
    },
    {
      $unwind: '$orderDetails' // Unwind the order details array
    },
    {
      $match: { 'orderDetails.status': 'delivered',
         'orderDetails.created_at': { 
            $gte: new Date(startDate), // Orders created on or after startDate
            $lte: new Date(endDate)    // Orders created on or before endDate
          }, } // Only include delivered orders
    },
    {
      $group: {
        _id: "$product_id",
        totalTimesBought: { $sum: "$quantity" }, // Sum of quantities for each product
        totalRevenue: { $sum: { $multiply: ["$price", "$quantity"] } }, // Sum of revenue (price * quantity)
      }
    }
  ]);

  // Step 2: Fetch all products
  const allProducts = await Product.find();

  // Step 3: Combine the data, setting revenue and total times bought to 0 for products that have not been bought
  const productsWithStats = allProducts.map(product => {
    const stats = orderItems.find(item => item._id.toString() === product._id.toString());
    return {
      product,
      totalTimesBought: stats ? stats.totalTimesBought : 0,
      totalRevenue: stats ? stats.totalRevenue : 0
    };
  });

  return res.status(200).json(productsWithStats);
} catch (err) {
    console.error('Error fetching product stats:', err);
    return res.status(500).json({ error: 'Error fetching product stats' });
  }
};






exports.getProductRevenueAndCountBetweenDatesPDF  = async (req , res) => {
  const { productId } = req.params;
  const {  startDate, endDate } = req.query; // Or req.query, depending on how you're sending data
  try {
    // Step 1: Aggregate data from OrderItem to calculate revenue and total times bought for a specific product within a date range
    const orderItems = await OrderItem.aggregate([
      {
        $lookup: {
          from: 'orders', // The collection name for 'Order' should be 'orders' in MongoDB
          localField: 'Order_id',
          foreignField: '_id',
          as: 'orderDetails'
        }
      },
      {
        $unwind: '$orderDetails' // Unwind the order details array
      },
      {
        $match: {
          'orderDetails.status': 'delivered', // Only include delivered orders
          'orderDetails.created_at': { 
            $gte: new Date(startDate), // Orders created on or after startDate
            $lte: new Date(endDate)    // Orders created on or before endDate
          },
        }
      },
      {
        $group: {
          _id: "$product_id",
          totalTimesBought: { $sum: "$quantity" }, // Sum of quantities for the product
          totalRevenue: { $sum: { $multiply: ["$price", "$quantity"] } }, // Sum of revenue (price * quantity)
        }
      }
    ]);
    
    // Step 2: Fetch the specific product
    const product = await Product.findById(productId);
    var myItem = {}
    orderItems.map(num => {
    if (num._id == product._id.toString() ) {
      myItem =  num; // Return the number (or something else if needed)
    }
  });
    // Step 3: Combine the data, setting revenue and total times bought to 0 if no orders exist for this product
    const productWithStats = {
      product , 
      totalTimesBought: myItem ? myItem.totalTimesBought : 0,
      totalRevenue: myItem ? myItem.totalRevenue : 0
    };
  
    const pdfBuffer = await generateProductReportPDF(productWithStats ,  startDate , endDate)
   
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="orders_report.pdf"',
      'Content-Length': pdfBuffer.length,
    });

    // Send the PDF buffer
    res.end(pdfBuffer); // Use res.end() to send the buffer
    } catch (err) {
    console.error('Error fetching product stats:', err);
    return res.status(500).json({ error: 'Error fetching product stats' });
  }
};

const puppeteer = require('puppeteer');

const axios = require('axios');

const generateProductReportPDF = async (productWithStats, startDate, endDate) => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  try {
    // Fetch the product image and convert it to base64
    const imageUrl = productWithStats.product.image_url;
    const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const base64Image = `data:image/jpeg;base64,${Buffer.from(imageResponse.data).toString('base64')}`;

    const htmlContent = `
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 0; font-size: 14px; line-height: 1.6; color: #333; }
          .container { padding: 40px; max-width: 800px; margin: 0 auto; }
          h1 { font-size: 24px; text-align: center; color: #1a73e8; margin-bottom: 40px; }
          .section { margin-bottom: 30px; }
          .section h2 { font-size: 20px; border-bottom: 2px solid #1a73e8; padding-bottom: 5px; margin-bottom: 15px; color: #1a73e8; }
          .info { margin-bottom: 10px; }
          .info label { font-weight: bold; }
          .footer { text-align: center; padding: 20px; background-color: #f1f1f1; font-size: 12px; }
          .product-image { display: block; max-width: 50%; height: auto; margin: 20px auto; border: 1px solid #ddd; border-radius: 5px; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Rapport de Ventes de Produit</h1>
          <div class="section">
            <h2>Informations Produit</h2>
            <img src="${base64Image}" alt="${productWithStats.product.name}" class="product-image" />
            <div class="info"><label>Nom du Produit : </label> ${productWithStats.product.name || 'N/A'} </div>
            <div class="info"><label>Description : </label> ${productWithStats.product.description || 'N/A'}</div>
            <div class="info"><label>Prix : </label> ${productWithStats.product.price.toFixed(2) || 'N/A'} €</div>
          </div>
          <div class="section">
            <h2>Informations de Vente</h2>
            <div class="info"><label>de : </label> ${startDate || 'N/A'}</div>
            <div class="info"><label>a : </label> ${endDate || 'N/A'}</div>
            <div class="info"><label>Total des Commandes : </label> ${productWithStats.totalTimesBought || 'N/A'}</div>
            <div class="info"><label>Revenu Total : </label> ${productWithStats.totalRevenue.toFixed(2) || 'N/A'} €</div>
          </div>
          <div class="footer">
            Rapport généré le : ${new Date().toLocaleDateString() || 'N/A'}
          </div>
        </div>
      </body>
      </html>
    `;

    await page.setContent(htmlContent, { waitUntil: 'domcontentloaded' });

    // Generate the PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' },
    });

    await browser.close();

    return pdfBuffer;
  } catch (err) {
    console.error('Error generating PDF:', err);
    await browser.close();
    throw new Error('PDF Generation failed');
  }
};


exports.getProductsList = async (req, res) => {
  try {
    const products = await Product.find({}, 'name _id'); // Fetch only name and _id fields
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching products', error });
  }
};
