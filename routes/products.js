const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const fs = require('fs');
const path = require('path');

// Get all products
router.get('/', async (req, res) => {
  const products = await Product.find();
  res.json(products);
});

// Get single product
router.get('/:id', async (req, res) => {
  const product = await Product.findById(req.params.id);
  res.json(product);
});

// Seed products from data.json
router.post('/seed', async (req, res) => {
  try {
    await Product.deleteMany();
    
    // Read products from data.json file
    const dataPath = path.join(__dirname, '..', 'data.json');
    const jsonData = fs.readFileSync(dataPath, 'utf8');
    const { products } = JSON.parse(jsonData);
    
    await Product.insertMany(products);
    res.json({ message: 'Products seeded successfully', count: products.length });
  } catch (error) {
    console.error('Error seeding products:', error);
    res.status(500).json({ error: 'Failed to seed products' });
  }
});

// Get products from JSON file (for development)
router.get('/json', async (req, res) => {
  try {
    const dataPath = path.join(__dirname, '..', 'data.json');
    const jsonData = fs.readFileSync(dataPath, 'utf8');
    const { products } = JSON.parse(jsonData);
    res.json(products);
  } catch (error) {
    console.error('Error reading products from JSON:', error);
    res.status(500).json({ error: 'Failed to read products from JSON file' });
  }
});

module.exports = router;
