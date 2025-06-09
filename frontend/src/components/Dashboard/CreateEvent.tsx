import React, { useEffect, useState } from 'react';
import EventForm from './EventForm';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiClient } from '../../lib/api';
import toast from 'react-hot-toast';

const CreateEvent: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const eventId = searchParams.get('id');
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(!!eventId);

  useEffect(() => {
    if (eventId) {
      apiClient.getEvent(eventId)
        .then((eventData) => {
          setEvent(eventData);
        })
        .catch(() => {
          toast.error('Failed to load event');
          navigate('/admin/events');
        })
        .finally(() => setLoading(false));
    }
  }, [eventId, navigate]);

  const handleSave = async (data: any) => {
    let success = false;
    try {
      if (eventId) {
        await apiClient.updateEvent(eventId, data);
        toast.success('Event updated successfully');
      } else {
        await apiClient.createEvent(data);
        toast.success('Event created successfully');
      }
      success = true;
    } catch {
      toast.error('Failed to save event');
    }
    if (success) navigate('/admin/events');
  };

  if (loading) return <div className="py-8">Loading...</div>;

  return (
    <div className="py-2">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{eventId ? 'Edit Event' : 'Create New Event'}</h1>
        <p className="text-gray-500 max-w-2xl">
          {eventId
            ? 'Update the details of your event below. Make sure all information is accurate before saving.'
            : 'Fill out the form below to create a new event. You can specify registration fields, fees, and more.'}
        </p>
      </div>
      <section className="">
        <EventForm
          event={event}
          onClose={() => navigate('/admin/events')}
          onSave={handleSave}
          isEdit={!!eventId}
        />
      </section>
    </div>
  );
};

export default CreateEvent; 