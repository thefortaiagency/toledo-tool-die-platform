const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');
const https = require('https');

// Initialize OpenAI - API key must be set in environment variable
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function generateLoginBackground() {
  console.log('🎨 Generating Toledo Tool & Die login background...\n');

  try {
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: `Create a professional background image for a manufacturing company login page:
        - Modern industrial manufacturing facility interior
        - Show CNC machines, industrial equipment, factory floor
        - Heavily faded and blurred for use as a subtle background
        - Dark tones with steel gray and hints of orange (#ff6600)
        - Add a dark overlay effect for text readability
        - Professional, clean, modern aesthetic
        - Photorealistic but muted and atmospheric
        - Should evoke precision manufacturing and quality
        - 16:9 aspect ratio for web use`,
      n: 1,
      size: "1792x1024",
      quality: "hd",
      style: "natural"
    });

    const imageUrl = response.data[0].url;
    console.log('✅ Image generated successfully!');
    console.log('📍 URL:', imageUrl);

    // Download the image
    const publicDir = path.join(__dirname, '..', 'public');
    const imagePath = path.join(publicDir, 'login-background.jpg');

    console.log('\n📥 Downloading image...');

    const file = fs.createWriteStream(imagePath);
    
    https.get(imageUrl, (response) => {
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        console.log('✅ Image saved to: public/login-background.jpg');
        console.log('\n🎯 Next steps:');
        console.log('1. The image has been saved to your public folder');
        console.log('2. Update your login page to use: /login-background.jpg');
        console.log('3. Apply CSS: background-image: url("/login-background.jpg")');
      });
    }).on('error', (err) => {
      fs.unlink(imagePath, () => {});
      console.error('❌ Error downloading image:', err.message);
    });

  } catch (error) {
    console.error('❌ Error generating image:', error.message);
    if (error.response) {
      console.error('API Response:', error.response.data);
    }
  }
}

// Run the generator
generateLoginBackground();