const fs = require('fs');
const path = require('path');
const https = require('https');
const { promisify } = require('util');

const data = JSON.parse(fs.readFileSync('./data.json', 'utf8'));

// Create assets directory if it doesn't exist
const assetsDir = path.join(__dirname, 'assets');
if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir);
}

// Function to download image
const downloadImage = (url, filename) => {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(path.join(assetsDir, filename));
        
        https.get(url, (response) => {
            if (response.statusCode === 200) {
                response.pipe(file);
                file.on('finish', () => {
                    file.close();
                    console.log(`Downloaded: ${filename}`);
                    resolve();
                });
            } else {
                file.close();
                fs.unlink(path.join(assetsDir, filename), () => {}); // Delete incomplete file
                reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
            }
        }).on('error', (err) => {
            file.close();
            fs.unlink(path.join(assetsDir, filename), () => {}); // Delete incomplete file
            reject(err);
        });
    });
};

// Function to delay between downloads
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Download all images
const downloadAllImages = async () => {
    const updatedProducts = [];
    
    for (let i = 0; i < data.products.length; i++) {
        const product = data.products[i];
        const imageUrl = product.image;
        
        // Extract image ID from Unsplash URL for filename
        const urlParts = imageUrl.split('/');
        const photoId = urlParts[urlParts.indexOf('photo-1') + 1] || `image-${i + 1}`;
        const filename = `${photoId.split('?')[0]}.jpg`;
        
        try {
            await downloadImage(imageUrl, filename);
            
            // Update product with local image path
            updatedProducts.push({
                ...product,
                image: `/assets/${filename}`
            });
            
            // Add delay to be respectful to Unsplash servers
            await delay(500);
            
        } catch (error) {
            console.error(`Error downloading image for ${product.name}:`, error.message);
            // Keep original URL if download fails
            updatedProducts.push(product);
        }
    }
    
    // Update data.json with local image paths
    const updatedData = {
        ...data,
        products: updatedProducts
    };
    
    fs.writeFileSync('./data.json', JSON.stringify(updatedData, null, 2));
    console.log('Updated data.json with local image paths');
};

downloadAllImages().catch(console.error);
