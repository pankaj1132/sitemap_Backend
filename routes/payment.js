const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');

// Middleware to verify JWT token
const auth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token is not valid' });
  }
};

// Fake payment processing endpoint
router.post('/process', auth, async (req, res) => {
  try {
    const { 
      cardNumber, 
      expiryDate, 
      cvv, 
      cardholderName, 
      billingAddress,
      amount,
      items 
    } = req.body;

    // Simulate payment validation
    if (!cardNumber || !expiryDate || !cvv || !cardholderName) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required payment information' 
      });
    }

    // Simulate different card number responses for testing
    const lastFourDigits = cardNumber.slice(-4);
    
    // Simulate payment processing delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Different responses based on card number for testing
    if (lastFourDigits === '0000') {
      return res.status(400).json({
        success: false,
        message: 'Payment declined - Insufficient funds'
      });
    } else if (lastFourDigits === '9999') {
      return res.status(400).json({
        success: false,
        message: 'Payment declined - Invalid card'
      });
    }

    // Generate fake transaction ID
    const transactionId = 'TXN_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

    // Simulate successful payment
    const paymentResult = {
      success: true,
      transactionId,
      amount,
      currency: 'USD',
      status: 'completed',
      paymentMethod: {
        type: 'credit_card',
        lastFour: lastFourDigits,
        brand: getCardBrand(cardNumber)
      },
      billingAddress,
      timestamp: new Date().toISOString(),
      items,
      orderId: 'ORD_' + Date.now()
    };

    res.json(paymentResult);
  } catch (error) {
    console.error('Payment processing error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Payment processing failed' 
    });
  }
});

// Helper function to determine card brand
function getCardBrand(cardNumber) {
  const firstDigit = cardNumber.charAt(0);
  const firstTwoDigits = cardNumber.substr(0, 2);
  const firstFourDigits = cardNumber.substr(0, 4);

  if (firstDigit === '4') {
    return 'Visa';
  } else if (['51', '52', '53', '54', '55'].includes(firstTwoDigits) || 
             (parseInt(firstFourDigits) >= 2221 && parseInt(firstFourDigits) <= 2720)) {
    return 'Mastercard';
  } else if (['34', '37'].includes(firstTwoDigits)) {
    return 'American Express';
  } else if (firstFourDigits === '6011' || firstTwoDigits === '65') {
    return 'Discover';
  } else {
    return 'Unknown';
  }
}

// Get payment methods (for demo purposes)
router.get('/methods', auth, (req, res) => {
  const paymentMethods = [
    {
      id: 'credit_card',
      name: 'Credit Card',
      description: 'Pay with Visa, Mastercard, American Express, or Discover',
      icon: '💳'
    },
    {
      id: 'paypal',
      name: 'PayPal',
      description: 'Pay with your PayPal account',
      icon: '🅿️'
    },
    {
      id: 'apple_pay',
      name: 'Apple Pay',
      description: 'Pay with Touch ID or Face ID',
      icon: '🍎'
    },
    {
      id: 'google_pay',
      name: 'Google Pay',
      description: 'Pay with Google Pay',
      icon: '🔴'
    }
  ];

  res.json(paymentMethods);
});

module.exports = router;
