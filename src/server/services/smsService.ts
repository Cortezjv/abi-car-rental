import axios from 'axios';

// Configuration (store in environment variables later)
const SMS_CONFIG = {
  // Choose your provider: 'ihuyi', 'semaphore', 'twilio', 'vonage', etc.
  provider: process.env.SMS_PROVIDER || 'console', // 'console' for development
  
  // iHuyi (you mentioned this)
  ihuyi: {
    apiUrl: 'http://106.ihuyi.com/webservice/sms.php?method=Submit',
    account: process.env.IHUYI_ACCOUNT,
    password: process.env.IHUYI_PASSWORD,
  },
  
  // Semaphore (popular in PH)
  semaphore: {
    apiUrl: 'https://api.semaphore.co/api/v4/messages',
    apiKey: process.env.SEMAPHORE_API_KEY,
  },
  
  // Twilio (international)
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    fromNumber: process.env.TWILIO_PHONE_NUMBER,
  }
};

class SMSService {
  /**
   * Generate 6-digit OTP
   */
  generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Send OTP via configured SMS provider
   */
  async sendOTP(phone: string, otp: string): Promise<boolean> {
    // Format phone to international format
    const formattedPhone = this.formatPhoneForSMS(phone);
    
    const message = `Your ABI Car Rental verification code is: ${otp}. Valid for 5 minutes.`;
    
    console.log(`📱 Attempting to send OTP to ${formattedPhone}`);
    
    const provider = SMS_CONFIG.provider;
    
    try {
      switch (provider) {
        case 'ihuyi':
          return await this.sendViaIhuyi(formattedPhone, message);
          
        case 'semaphore':
          return await this.sendViaSemaphore(formattedPhone, message);
          
        case 'twilio':
          return await this.sendViaTwilio(formattedPhone, message);
          
        case 'console':
        default:
          // Development mode - just log to console
          console.log('\n=================================');
          console.log('📱 SMS SIMULATION');
          console.log(`To: ${formattedPhone}`);
          console.log(`Message: ${message}`);
          console.log(`OTP: ${otp}`);
          console.log('=================================\n');
          return true;
      }
    } catch (error) {
      console.error('SMS sending failed:', error);
      return false;
    }
  }

  /**
   * Format phone number for SMS provider
   */
  private formatPhoneForSMS(phone: string): string {
    // Remove all non-digits
    let cleaned = phone.replace(/\D/g, '');
    
    // If Philippine number, ensure it's in international format
    if (cleaned.startsWith('0')) {
      cleaned = '63' + cleaned.substring(1);
    } else if (cleaned.length === 10 && cleaned.startsWith('9')) {
      cleaned = '63' + cleaned;
    }
    
    // Add + for some providers
    return '+' + cleaned;
  }

  /**
   * Send via iHuyi (Chinese provider)
   */
  private async sendViaIhuyi(phone: string, message: string): Promise<boolean> {
    const { account, password, apiUrl } = SMS_CONFIG.ihuyi;
    
    if (!account || !password) {
      throw new Error('iHuyi credentials not configured');
    }
    
    const params = new URLSearchParams();
    params.append('account', account);
    params.append('password', password);
    params.append('mobile', phone);
    params.append('content', message);
    
    const response = await axios.post(apiUrl, params);
    
    // Parse iHuyi response (usually XML)
    const data = response.data;
    console.log('iHuyi response:', data);
    
    // Check if successful (iHuyi returns code 2 for success)
    return data.includes('<code>2</code>');
  }

  /**
   * Send via Semaphore (Philippine provider)
   */
  private async sendViaSemaphore(phone: string, message: string): Promise<boolean> {
    const { apiKey, apiUrl } = SMS_CONFIG.semaphore;
    
    if (!apiKey) {
      throw new Error('Semaphore API key not configured');
    }
    
    // Remove + for Semaphore
    const cleanPhone = phone.replace('+', '');
    
    const response = await axios.post(apiUrl, {
      apikey: apiKey,
      number: cleanPhone,
      message: message,
      sendername: 'ABIRENT' // Max 11 chars
    });
    
    return response.status === 200;
  }

  /**
   * Send via Twilio
   */
  private async sendViaTwilio(phone: string, message: string): Promise<boolean> {
    const { accountSid, authToken, fromNumber } = SMS_CONFIG.twilio;
    
    if (!accountSid || !authToken || !fromNumber) {
      throw new Error('Twilio credentials not configured');
    }
    
    const client = require('twilio')(accountSid, authToken);
    
    const response = await client.messages.create({
      body: message,
      from: fromNumber,
      to: phone
    });
    
    return response.status === 'queued' || response.status === 'sent';
  }

  /**
   * Send booking notification to owner
   */
  async sendBookingNotification(ownerPhone: string, bookingDetails: any): Promise<boolean> {
    const message = `
New Booking Request:
Renter: ${bookingDetails.fullname}
Phone: ${bookingDetails.phone}
Vehicle: ${bookingDetails.vehicleName}
Date: ${bookingDetails.pickupDate} to ${bookingDetails.returnDate}
Options: ${bookingDetails.deliveryOption || 'Pickup'}, ${bookingDetails.driverOption || 'No Driver'}
    `.trim();
    
    return await this.sendOTP(ownerPhone, message);
  }
}

export default new SMSService();
