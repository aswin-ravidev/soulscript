import { User } from '@/lib/models/User';
import { JournalEntry } from '@/lib/models/JournalEntry';
import { EmergencyContact } from '@/lib/models/EmergencyContact';
import connectDB from '@/lib/mongodb';
import { sendEmail } from '@/lib/email';
import { sendSMS } from '@/lib/sms';

interface EmergencyContact {
  name: string;
  phone: string;
  email: string;
}

/**
 * Send an emergency alert for suicidal content
 */
export async function sendSuicidalAlert(userId: string, journalEntry: any) {
  try {
    await connectDB();
    
    // Get emergency contacts for this user
    const dbContacts = await EmergencyContact.find({ userId });
    
    if (dbContacts.length === 0) {
      // Try to get contacts from user document if they exist there
      const user = await User.findById(userId);
      if (user && user.emergencyContacts && user.emergencyContacts.length > 0) {
        console.log('Using emergency contacts from user document');
        const contacts = user.emergencyContacts;
        // Prepare the alert message
        const alertMessage = `
        Urgent: Mental Health Alert

        Dear ${contacts[0].name},

        We've noticed that ${user.name} might need your support right now. 
        Please reach out to them immediately.

        If you're concerned about their safety, contact emergency services.

        Thank you,
        SoulScript Team
        `;

        // Send notifications to all emergency contacts
        let notifiedCount = 0;
        for (const contact of contacts) {
          if (contact.email) {
            await sendEmail({
              to: contact.email,
              subject: 'Urgent: Mental Health Alert',
              text: alertMessage
            });
            notifiedCount++;
          }

          if (contact.phoneNumber) {
            await sendSMS({
              to: contact.phoneNumber,
              message: alertMessage
            });
            notifiedCount++;
          }
        }

        console.log(`Sent emergency alerts to ${notifiedCount} contacts for user ${userId}`);
        return { 
          success: true, 
          message: `Sent emergency alerts to ${notifiedCount} contacts` 
        };
      } else {
        console.log('No emergency contacts found for user', userId);
        return { success: false, message: 'No emergency contacts found' };
      }
    }

    // Prepare the alert message
    const user = await User.findById(userId);
    if (!user) {
      console.error('User not found for emergency alert');
      return { success: false, message: 'User not found' };
    }

    const alertMessage = `
    Urgent: Mental Health Alert

    Dear ${dbContacts[0].name},

    We've noticed that ${user.name} might need your support right now. 
    Please reach out to them immediately.

    If you're concerned about their safety, contact emergency services.

    Thank you,
    SoulScript Team
    `;

    // Send notifications to all emergency contacts
    let notifiedCount = 0;
    for (const contact of dbContacts) {
      if (contact.email) {
        await sendEmail({
          to: contact.email,
          subject: 'Urgent: Mental Health Alert',
          text: alertMessage
        });
        notifiedCount++;
      }

      if (contact.phoneNumber) {
        await sendSMS({
          to: contact.phoneNumber,
          message: alertMessage
        });
        notifiedCount++;
      }
    }

    console.log(`Sent emergency alerts to ${notifiedCount} contacts for user ${userId}`);
    return { 
      success: true, 
      message: `Sent emergency alerts to ${notifiedCount} contacts` 
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
      // Get emergency contacts
      const dbContacts = await EmergencyContact.find({ userId });
      
      if (dbContacts.length === 0) {
        // Try to get contacts from user document if they exist there
        const user = await User.findById(userId);
        if (user && user.emergencyContacts && user.emergencyContacts.length > 0) {
          console.log('Using emergency contacts from user document');
          const contacts = user.emergencyContacts;
          // Get most common mental health condition
          const classifications = recentEntries.map(entry => entry.mentalHealthClass);
          const mostCommonCondition = classifications.reduce((acc, curr) => {
            const count = classifications.filter(x => x === curr).length;
            return count > acc.count ? { condition: curr, count } : acc;
          }, { condition: '', count: 0 }).condition;

          // Prepare the alert message
          const alertMessage = `
          Urgent: Mental Health Alert

          Dear ${contacts[0].name},

          We've noticed that ${user.name} might need your support right now. 
          Please reach out to them immediately.

          If you're concerned about their safety, contact emergency services.

          Thank you,
          SoulScript Team
          `;

          // Send notifications to all emergency contacts
          let notifiedCount = 0;
          for (const contact of contacts) {
            if (contact.email) {
              await sendEmail({
                to: contact.email,
                subject: 'Urgent: Mental Health Alert',
                text: alertMessage
              });
              notifiedCount++;
            }

            if (contact.phoneNumber) {
              await sendSMS({
                to: contact.phoneNumber,
                message: alertMessage
              });
              notifiedCount++;
            }
          }

          return { 
            success: true, 
            message: `Sent pattern alerts to ${notifiedCount} contacts` 
          };
        } else {
          console.log('No emergency contacts found for user', userId);
          return { success: false, message: 'No emergency contacts found' };
        }
      }

      // Get most common mental health condition
      const classifications = recentEntries.map(entry => entry.mentalHealthClass);
      const mostCommonCondition = classifications.reduce((acc, curr) => {
        const count = classifications.filter(x => x === curr).length;
        return count > acc.count ? { condition: curr, count } : acc;
      }, { condition: '', count: 0 }).condition;

      // Prepare the alert message
      const user = await User.findById(userId);
      if (!user) {
        console.error('User not found for emergency alert');
        return { success: false, message: 'User not found' };
      }

      const alertMessage = `
      Urgent: Mental Health Alert

      Dear ${dbContacts[0].name},

      We've noticed that ${user.name} might need your support right now. 
      Please reach out to them immediately.

      If you're concerned about their safety, contact emergency services.

      Thank you,
      SoulScript Team
      `;

      // Send notifications to all emergency contacts
      let notifiedCount = 0;
      for (const contact of dbContacts) {
        if (contact.email) {
          await sendEmail({
            to: contact.email,
            subject: 'Urgent: Mental Health Alert',
            text: alertMessage
          });
          notifiedCount++;
        }

        if (contact.phoneNumber) {
          await sendSMS({
            to: contact.phoneNumber,
            message: alertMessage
          });
          notifiedCount++;
        }
      }

      return { 
        success: true, 
        message: `Sent pattern alerts to ${notifiedCount} contacts` 
      };
    }

    return { success: true, message: 'No concerning patterns detected' };
  } catch (error) {
    console.error('Error checking recent entries:', error);
    return { success: false, message: 'Failed to check entries' };
  }
}