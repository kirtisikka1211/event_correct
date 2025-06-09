import supabase from '../config/supabase.js';

export const createRegistration = async (req, res) => {
  try {
    const { event_id, registration_data } = req.body;
    
    if (!event_id) {
      return res.status(400).json({ error: 'Event ID is required' });
    }

    // Check if event exists
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('*')
      .eq('id', event_id)
      .single();

    if (eventError || !event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Check if user is already registered
    const { data: existingReg, error: checkError } = await supabase
      .from('registrations')
      .select('*')
      .eq('event_id', event_id)
      .eq('user_id', req.user.userId)
      .single();

    if (existingReg) {
      return res.status(400).json({ error: 'Already registered for this event' });
    }

    // Get user details
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('full_name, email')
      .eq('id', req.user.userId)
      .single();

    if (userError || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Create registration
    const { data: registration, error: createError } = await supabase
      .from('registrations')
      .insert({
        event_id,
        user_id: req.user.userId,
        registration_data,
        status: 'registered',
        full_name: user.full_name,
        email: user.email,
      })
      .select()
      .single();

    if (createError) {
      console.error('Registration creation error:', createError);
      throw createError;
    }

    // Update event attendee count
    const { error: updateError } = await supabase
      .from('events')
      .update({ current_attendees: event.current_attendees + 1 })
      .eq('id', event_id);

    if (updateError) {
      console.error('Error updating attendee count:', updateError);
    }

    res.status(201).json(registration);
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getUserRegistrations = async (req, res) => {
  try {
    const { data: registrations, error } = await supabase
      .from('registrations')
      .select(`
        *,
        events (*)
      `)
      .eq('user_id', req.user.userId);

    if (error) throw error;
    res.json(registrations);
  } catch (error) {
    console.error('Get registrations error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getEventRegistrations = async (req, res) => {
  try {
    const { eventId } = req.params;

    // Check if user is admin or event creator
    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('created_by')
      .eq('id', eventId)
      .single();

    if (eventError) throw eventError;

    if (req.user.role !== 'admin' && event.created_by !== req.user.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const { data: registrations, error } = await supabase
      .from('registrations')
      .select('*')
      .eq('event_id', eventId);

    if (error) throw error;
    res.json(registrations);
  } catch (error) {
    console.error('Get event registrations error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateRegistration = async (req, res) => {
  try {
    const { registrationId } = req.params;
    const { registration_data } = req.body;

    // Check if registration exists and belongs to user
    const { data: registration, error: checkError } = await supabase
      .from('registrations')
      .select('*')
      .eq('id', registrationId)
      .eq('user_id', req.user.userId)
      .single();

    if (checkError || !registration) {
      return res.status(404).json({ error: 'Registration not found' });
    }

    const { data: updatedRegistration, error: updateError } = await supabase
      .from('registrations')
      .update({ registration_data, last_modified_at: new Date().toISOString() })
      .eq('id', registrationId)
      .select()
      .single();

    if (updateError) throw updateError;
    res.json(updatedRegistration);
  } catch (error) {
    console.error('Update registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const checkIn = async (req, res) => {
  try {
    const { registrationId } = req.params;

    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const { data: registration, error: updateError } = await supabase
      .from('registrations')
      .update({ 
        checked_in_at: new Date().toISOString(),
        status: 'checked_in'
      })
      .eq('id', registrationId)
      .select()
      .single();

    if (updateError) throw updateError;
    res.json(registration);
  } catch (error) {
    console.error('Check-in error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}; 