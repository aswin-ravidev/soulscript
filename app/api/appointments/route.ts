import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import { Appointment } from '@/lib/models/Appointment';
import { withAuth } from '@/lib/auth';

// GET - Get appointments for a user (either as patient or therapist)
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const user = await withAuth(request);
    if (!user || user.status === 401) {
      return user; // Returns the error response from withAuth
    }
    
    // Connect to database
    await connectDB();
    
    // Get query parameters
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status'); // upcoming, past, all
    const role = searchParams.get('role'); // optional - filter by user role
    
    // Base query - find appointments where user is either patient or therapist
    let query: any = {
      $or: [
        { patient: user.id },
        { therapist: user.id }
      ]
    };
    
    // Get appointments without filtering for status
    const allAppointments = await Appointment.find(query)
      .populate('patient', 'name email')
      .populate('therapist', 'name email specialization')
      .sort({ date: 1 });
    
    // Get current date and time
    const now = new Date();
    console.log(`Current time for comparison: ${now.toISOString()}`);
    
    // Client-side filtering based on current time (not just date)
    if (status === 'upcoming' || status === 'past') {
      // Process each appointment to compare with current time
      const filteredAppointments = allAppointments.filter(appointment => {
        // Create date object from appointment date
        const appointmentDate = new Date(appointment.date);
        
        // Extract hour and minute from time string (e.g., "14:30")
        const timeMatch = appointment.time?.match(/(\d+):(\d+)/);
        
        // If we have a valid time, set the hours and minutes
        if (timeMatch && timeMatch.length >= 3) {
          const hours = parseInt(timeMatch[1], 10);
          const minutes = parseInt(timeMatch[2], 10);
          appointmentDate.setHours(hours, minutes, 0, 0);
        }
        
        // Log for debugging
        console.log(`Appointment ${appointment._id} date+time: ${appointmentDate.toISOString()}`);
        console.log(`Is after current time? ${appointmentDate > now}`);
        
        if (status === 'upcoming') {
          // For upcoming, we want appointments that are in the future and not cancelled
          return appointmentDate > now && appointment.status !== 'cancelled';
        } else {
          // For past, we want appointments that are in the past
          return appointmentDate <= now;
        }
      });
      
      console.log(`Filtered to ${filteredAppointments.length} ${status} appointments`);
      
      // Sort: upcoming by date ASC (closest first), past by date DESC (most recent first)
      if (status === 'past') {
        filteredAppointments.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      } else {
        filteredAppointments.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      }
      
      return NextResponse.json({ success: true, appointments: filteredAppointments });
    }
    
    // If no status filtering is requested, return all appointments
    return NextResponse.json({ success: true, appointments: allAppointments });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch appointments' },
      { status: 500 }
    );
  }
}

// POST - Create a new appointment
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const user = await withAuth(request);
    if (!user || user.status === 401) {
      return user; // Returns the error response from withAuth
    }
    
    // Connect to database
    await connectDB();
    
    // Get appointment data from request
    const data = await request.json();
    const { therapistId, patientId, date, time, type, location, notes } = data;
    
    // Determine patient and therapist based on user role
    let patient, therapist;
    
    if (user.role === 'therapist') {
      // Therapist is creating appointment for a patient
      if (!patientId) {
        return NextResponse.json(
          { success: false, message: 'Patient ID is required' },
          { status: 400 }
        );
      }
      patient = patientId;
      therapist = user.id;
    } else {
      // Patient is creating appointment with a therapist
      if (!therapistId) {
        return NextResponse.json(
          { success: false, message: 'Therapist ID is required' },
          { status: 400 }
        );
      }
      patient = user.id;
      therapist = therapistId;
    }
    
    // Create appointment
    const appointment = await Appointment.create({
      patient,
      therapist,
      date: new Date(date),
      time,
      type,
      location,
      notes,
      status: 'scheduled'
    });
    
    // Return the new appointment
    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('patient', 'name email')
      .populate('therapist', 'name email specialization');
    
    return NextResponse.json(
      { success: true, message: 'Appointment created', appointment: populatedAppointment },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating appointment:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create appointment' },
      { status: 500 }
    );
  }
}

// PATCH - Update an appointment (reschedule, cancel, add notes)
export async function PATCH(request: NextRequest) {
  try {
    // Authenticate user
    const user = await withAuth(request);
    if (!user || user.status === 401) {
      return user; // Returns the error response from withAuth
    }
    
    // Connect to database
    await connectDB();
    
    // Get data from request
    const data = await request.json();
    const { appointmentId, status, date, time, type, location, notes } = data;
    
    if (!appointmentId) {
      return NextResponse.json(
        { success: false, message: 'Appointment ID is required' },
        { status: 400 }
      );
    }
    
    // Find the appointment
    const appointment = await Appointment.findById(appointmentId);
    
    if (!appointment) {
      return NextResponse.json(
        { success: false, message: 'Appointment not found' },
        { status: 404 }
      );
    }
    
    // Check if user is authorized to update this appointment
    if (appointment.patient.toString() !== user.id && appointment.therapist.toString() !== user.id) {
      return NextResponse.json(
        { success: false, message: 'Not authorized to update this appointment' },
        { status: 403 }
      );
    }
    
    // Update fields if provided
    if (status) appointment.status = status;
    if (date) appointment.date = date;
    if (time) appointment.time = time;
    if (type) appointment.type = type;
    if (location) appointment.location = location;
    if (notes) appointment.notes = notes;
    
    // If rescheduling, update status
    if (date || time) {
      appointment.status = 'rescheduled';
    }
    
    await appointment.save();
    
    // Get updated appointment with populated references
    const updatedAppointment = await Appointment.findById(appointmentId)
      .populate('patient', 'name email')
      .populate('therapist', 'name email specialization');
    
    return NextResponse.json(
      { success: true, message: 'Appointment updated', appointment: updatedAppointment }
    );
  } catch (error) {
    console.error('Error updating appointment:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update appointment' },
      { status: 500 }
    );
  }
} 