import { User } from '../models/User';
import { JournalEntry } from '../models/JournalEntry';
import connectDB from '../mongodb';

type EmergencyContact = {
  name: string;
  phone: string;
  email: string;
};

/**
 * Send an emergency alert for suicidal content
 */
export async function sendSuicidalAlert(userId: string, journalEntry: any) {
  try {
    await connectDB();
    
    // Get user with emergency contacts
    const user = await User.findById(userId);
    if (!user || !user.emergencyContacts || user.emergencyContacts.length === 0) {
      console.log('No emergency contacts found for user', userId);
      return { success: false, message: 'No emergency contacts found' };
    }
    
    // Send alerts to all emergency contacts
    const promises = user.emergencyContacts.map(async (contact: EmergencyContact) => {
      if (!contact.name || (!contact.phone && !contact.email)) {
        return null; // Skip invalid contacts
      }
      
      return sendAlert({
        contactName: contact.name,
        contactEmail: contact.email,
        contactPhone: contact.phone,
        userName: user.name,
        alertType: 'suicidal',
        entryDate: new Date(journalEntry.date).toLocaleString(),
        entryTitle: journalEntry.title
      });
    });
    
    // Wait for all alert sending attempts to complete
    const results = await Promise.all(promises);
    const successfulAlerts = results.filter(Boolean).length;
    
    console.log(`Sent ${successfulAlerts} suicidal alerts for user ${userId}`);
    return { 
      success: successfulAlerts > 0, 
      message: `Sent ${successfulAlerts} emergency alerts` 
    };
  } catch (error) {
    console.error('Error sending suicidal alerts:', error);
    return { success: false, message: 'Failed to send alerts' };
  }
}

/**
 * Check user's recent journal entries and send alert if concerning
 */
export async function checkRecentEntriesAndAlert(userId: string) {
  try {
    await connectDB();
    
    // Get 5 most recent entries
    const recentEntries = await JournalEntry.find({ userId })
      .sort({ date: -1 })
      .limit(5);
    
    if (recentEntries.length < 5) {
      return { success: false, message: 'Not enough recent entries to analyze' };
    }
    
    // Check if all recent entries have concerning mental health classifications
    const normalEntries = recentEntries.filter(entry => 
      entry.mentalHealthClass === 'Normal'
    );
    
    // If no entries are normal, send alerts
    if (normalEntries.length === 0) {
      // Get user with emergency contacts
      const user = await User.findById(userId);
      if (!user || !user.emergencyContacts || user.emergencyContacts.length === 0) {
        console.log('No emergency contacts found for user', userId);
        return { success: false, message: 'No emergency contacts found' };
      }
      
      // Get most common mental health class
      const classifications = recentEntries.map(entry => entry.mentalHealthClass);
      const mostCommonClass = getMostCommonClass(classifications);
      
      // Send alerts to all emergency contacts
      const promises = user.emergencyContacts.map(async (contact: EmergencyContact) => {
        if (!contact.name || (!contact.phone && !contact.email)) {
          return null; // Skip invalid contacts
        }
        
        return sendAlert({
          contactName: contact.name,
          contactEmail: contact.email,
          contactPhone: contact.phone,
          userName: user.name,
          alertType: 'concerning',
          primaryCondition: mostCommonClass,
          entryCount: recentEntries.length
        });
      });
      
      // Wait for all alert sending attempts to complete
      const results = await Promise.all(promises);
      const successfulAlerts = results.filter(Boolean).length;
      
      console.log(`Sent ${successfulAlerts} concerning pattern alerts for user ${userId}`);
      return { 
        success: successfulAlerts > 0, 
        message: `Sent ${successfulAlerts} pattern alerts` 
      };
    }
    
    return { success: false, message: 'No concerning pattern detected' };
  } catch (error) {
    console.error('Error checking recent entries:', error);
    return { success: false, message: 'Failed to check recent entries' };
  }
}

// Helper function to get the most common class in an array
function getMostCommonClass(arr: string[]) {
  const counts = arr.reduce((acc, curr) => {
    acc[curr] = (acc[curr] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])[0][0];
}

// Helper function to send alerts - in a real app, this would use SMS/email APIs
async function sendAlert(params: {
  contactName: string,
  contactEmail?: string,
  contactPhone?: string,
  userName: string,
  alertType: 'suicidal' | 'concerning',
  entryDate?: string,
  entryTitle?: string,
  primaryCondition?: string,
  entryCount?: number
}) {
  try {
    console.log('SENDING EMERGENCY ALERT:');
    console.log('To:', params.contactName);
    console.log('Method:', params.contactEmail ? 'Email' : 'SMS');
    
    // Create different messages based on alert type
    let message = '';
    if (params.alertType === 'suicidal') {
      message = `URGENT: ${params.userName} has created a journal entry that contains potentially suicidal content on ${params.entryDate}. Please reach out immediately to ensure their safety.`;
    } else {
      message = `ALERT: ${params.userName} has shown consistent signs of ${params.primaryCondition} in their last ${params.entryCount} journal entries. Please check on them as they may need support.`;
    }
    
    console.log('Message:', message);
    
    // In a production app, you would integrate with real SMS/email APIs
    // For SMS: Twilio, Vonage, etc.
    // For Email: SendGrid, Mailgun, AWS SES, etc.
    
    // For now, we're just logging that we would send the message
    if (params.contactEmail) {
      console.log(`Would send email to ${params.contactEmail}`);
      // Example email API call:
      // await sendEmailService.send({
      //   to: params.contactEmail,
      //   subject: params.alertType === 'suicidal' ? 'URGENT: Mental Health Alert' : 'Mental Health Alert',
      //   text: message
      // });
    }
    
    if (params.contactPhone) {
      console.log(`Would send SMS to ${params.contactPhone}`);
      // Example SMS API call:
      // await sendSmsService.send({
      //   to: params.contactPhone,
      //   body: message
      // });
    }
    
    return true;
  } catch (error) {
    console.error('Error sending alert:', error);
    return false;
  }
} 