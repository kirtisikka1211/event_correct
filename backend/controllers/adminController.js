import supabase from '../config/supabase.js';

export const getStats = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized: Admin access required' });
    }

    // Get total events count
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('*')
      .eq('created_by', req.user.userId);

    if (eventsError) throw eventsError;

    // Get total registrations across all events
    const { data: registrations, error: registrationsError } = await supabase
      .from('registrations')
      .select(`
        *,
        events!inner (
          created_by
        )
      `)
      .eq('events.created_by', req.user.userId);

    if (registrationsError) throw registrationsError;

    // Get upcoming events
    const { data: upcomingEvents, error: upcomingError } = await supabase
      .from('events')
      .select('*')
      .eq('created_by', req.user.userId)
      .gte('date', new Date().toISOString().split('T')[0])
      .order('date', { ascending: true });

    if (upcomingError) throw upcomingError;

    // Calculate check-in stats
    const checkedInCount = registrations?.filter(reg => reg.checked_in_at).length || 0;

    // Get recent registrations
    const { data: recentRegistrations, error: recentError } = await supabase
      .from('registrations')
      .select(`
        *,
        events!inner (
          title,
          created_by
        ),
        users (
          full_name,
          email
        )
      `)
      .eq('events.created_by', req.user.userId)
      .order('registered_at', { ascending: false })
      .limit(5);

    if (recentError) throw recentError;

    const stats = {
      totalEvents: events?.length || 0,
      totalRegistrations: registrations?.length || 0,
      upcomingEvents: upcomingEvents?.length || 0,
      checkedInCount,
      checkInRate: registrations?.length ? (checkedInCount / registrations.length * 100).toFixed(1) : 0,
      recentRegistrations: recentRegistrations?.map(reg => ({
        id: reg.id,
        eventTitle: reg.events.title,
        userName: reg.users.full_name,
        userEmail: reg.users.email,
        registeredAt: reg.registered_at,
        status: reg.status
      })) || [],
      upcomingEventsList: upcomingEvents?.map(event => ({
        id: event.id,
        title: event.title,
        date: event.date,
        time: event.time,
        location: event.location,
        registrationCount: event.current_attendees,
        maxAttendees: event.max_attendees
      })) || []
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}; 