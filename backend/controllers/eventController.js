import supabase from '../config/supabase.js';

const uploadQRCode = async (file, eventId) => {
  try {
    // Validate file type
    if (!file.mimetype || !file.mimetype.startsWith('image/')) {
      throw new Error('Invalid file type. Please upload an image file.');
    }

    const fileExt = file.name.split('.').pop();
    const fileName = `${eventId}_${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    // Upload the file to Supabase Storage
    const { data, error } = await supabase.storage
      .from('qr-codes')
      .upload(filePath, file.data, {
        contentType: file.mimetype,
        upsert: true
      });

    if (error) throw error;

    // Get the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('qr-codes')
      .getPublicUrl(filePath);

    return publicUrl;
  } catch (error) {
    console.error('Error uploading QR code:', error);
    throw error;
  }
};

export const getAllEvents = async (req, res) => {
  try {
    const { q: searchQuery } = req.query;
    let query = supabase
      .from('events')
      .select('*');

    if (req.user.role === 'admin') {
      query = query.eq('created_by', req.user.userId);
    } else {
      query = query.gte('date', new Date().toISOString().split('T')[0]);
    }

    if (searchQuery) {
      const searchPattern = `%${searchQuery}%`;
      query = query.or(`title.ilike.${searchPattern},description.ilike.${searchPattern}`);
    }

    const { data: events, error } = await query.order('date', { ascending: true });

    if (error) throw error;
    res.json(events);
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const createEvent = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    // Parse the event data from the form data
    let eventData;
    try {
      eventData = JSON.parse(req.body.data);
    } catch (error) {
      console.error('Error parsing event data:', error);
      return res.status(400).json({ error: 'Invalid event data format' });
    }

    const {
      title,
      description,
      date,
      time,
      location,
      max_attendees,
      bank_details,
      requires_checkin,
      registration_fields,
      registration_fee
    } = eventData;

    let qrCodeUrl = null;
    if (req.files?.qr_code) {
      qrCodeUrl = await uploadQRCode(req.files.qr_code, 'temp');
    }

    // Validate bank_details structure if provided
    if (bank_details && typeof bank_details === 'object') {
      const requiredFields = ['account_holder', 'account_number', 'ifsc_code', 'bank_name'];
      const missingFields = requiredFields.filter(field => !bank_details[field]);
      
      if (missingFields.length > 0) {
        return res.status(400).json({ 
          error: `Missing required bank details fields: ${missingFields.join(', ')}` 
        });
      }
    }

    // Validate registration fee if provided
    if (registration_fee !== null && registration_fee !== undefined) {
      const fee = parseFloat(registration_fee);
      if (isNaN(fee) || fee < 0) {
        return res.status(400).json({ error: 'Registration fee must be a non-negative number' });
      }
    }

    const { data: event, error } = await supabase
      .from('events')
      .insert([{
        title,
        description,
        date,
        time,
        location,
        max_attendees,
        registration_fee: registration_fee || null,
        bank_details: bank_details ? {
          ...bank_details,
          qr_code_url: qrCodeUrl
        } : null,
        requires_checkin,
        registration_fields: registration_fields || [],
        created_by: req.user.userId
      }])
      .select()
      .single();

    if (error) throw error;

    // If we uploaded a QR code with a temp name, update it with the actual event ID
    if (qrCodeUrl && event.id) {
      const newQrCodeUrl = await uploadQRCode(req.files.qr_code, event.id);
      const { error: updateError } = await supabase
        .from('events')
        .update({
          bank_details: {
            ...bank_details,
            qr_code_url: newQrCodeUrl
          }
        })
        .eq('id', event.id);

      if (updateError) {
        console.error('Error updating QR code URL:', updateError);
      }
    }

    res.status(201).json(event);
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getEventById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: event, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching event:', error);
      return res.status(404).json({ error: 'Event not found' });
    }

    // Check if user has access to this event
    if (req.user.role !== 'admin' && event.created_by !== req.user.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    res.json(event);
  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Parse the event data from the form data
    let updateData;
    try {
      updateData = JSON.parse(req.body.data);
    } catch (error) {
      console.error('Error parsing event data:', error);
      return res.status(400).json({ error: 'Invalid event data format' });
    }

    // Check if event exists and user has permission
    const { data: existingEvent, error: checkError } = await supabase
      .from('events')
      .select('created_by, bank_details')
      .eq('id', id)
      .single();

    if (checkError || !existingEvent) {
      return res.status(404).json({ error: 'Event not found' });
    }

    if (req.user.role !== 'admin' || existingEvent.created_by !== req.user.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    let qrCodeUrl = updateData.bank_details?.qr_code_url;
    if (req.files?.qr_code) {
      // Delete old QR code if it exists
      if (existingEvent.bank_details?.qr_code_url) {
        const oldFilePath = existingEvent.bank_details.qr_code_url.split('/').pop();
        await supabase.storage
          .from('qr-codes')
          .remove([oldFilePath]);
      }
      qrCodeUrl = await uploadQRCode(req.files.qr_code, id);
    }

    // Validate bank_details structure if provided
    if (updateData.bank_details && typeof updateData.bank_details === 'object') {
      const requiredFields = ['account_holder', 'account_number', 'ifsc_code', 'bank_name'];
      const missingFields = requiredFields.filter(field => !updateData.bank_details[field]);
      
      if (missingFields.length > 0) {
        return res.status(400).json({ 
          error: `Missing required bank details fields: ${missingFields.join(', ')}` 
        });
      }
    }

    // Validate registration fee if provided
    if (updateData.registration_fee !== null && updateData.registration_fee !== undefined) {
      const fee = parseFloat(updateData.registration_fee);
      if (isNaN(fee) || fee < 0) {
        return res.status(400).json({ error: 'Registration fee must be a non-negative number' });
      }
    }

    // Update the event
    const { data: updatedEvent, error: updateError } = await supabase
      .from('events')
      .update({
        ...updateData,
        bank_details: updateData.bank_details ? {
          ...updateData.bank_details,
          qr_code_url: qrCodeUrl || updateData.bank_details.qr_code_url
        } : null,
        registration_fee: updateData.registration_fee || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating event:', updateError);
      throw updateError;
    }

    res.json(updatedEvent);
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if event exists and user has permission
    const { data: existingEvent, error: checkError } = await supabase
      .from('events')
      .select('created_by')
      .eq('id', id)
      .single();

    if (checkError || !existingEvent) {
      return res.status(404).json({ error: 'Event not found' });
    }

    if (req.user.role !== 'admin' || existingEvent.created_by !== req.user.userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Delete the event
    const { error: deleteError } = await supabase
      .from('events')
      .delete()
      .eq('id', id);

    if (deleteError) {
      console.error('Error deleting event:', deleteError);
      throw deleteError;
    }

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}; 