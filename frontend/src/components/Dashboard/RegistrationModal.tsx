import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Calendar, MapPin, Clock, Users, QrCode, CreditCard } from 'lucide-react';
import { apiClient } from '../../lib/api';
import Button from '../UI/Button';
import Input from '../UI/Input';
import Card from '../UI/Card';
import toast from 'react-hot-toast';

interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  max_attendees: number;
  current_attendees: number;
  registration_fee: number;
  registration_fields?: Array<{
    key: string;
    label: string;
    type: string;
    required: boolean;
    options?: string[];
  }>;
  bank_details?: {
    account_holder: string;
    bank_name: string;
    account_number: string;
    ifsc_code: string;
    qr_code_url?: string;
  };
  image_url?: string;
}

interface RegistrationModalProps {
  event: Event;
  onClose: () => void;
  onRegistrationComplete: () => void;
}

const RegistrationModal: React.FC<RegistrationModalProps> = ({
  event,
  onClose,
  onRegistrationComplete,
}) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [step, setStep] = useState<'details' | 'payment'>('details');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'number' ? parseFloat(value) || 0 : value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (event.registration_fee > 0 && step === 'details') {
      setStep('payment');
      return;
    }

    setLoading(true);
    try {
      await apiClient.registerForEvent(event.id, formData);
      toast.success('Successfully registered for the event!');
      onRegistrationComplete();
    } catch (error: any) {
      console.error('Error registering for event:', error);
      toast.error(error.message || 'Failed to register for the event');
    } finally {
      setLoading(false);
    }
  };

  const renderField = (field: any) => {
    switch (field.type) {
      case 'select':
        return (
          <div key={field.key} className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </label>
            <select
              name={field.key}
              value={formData[field.key] || ''}
              onChange={handleInputChange}
              required={field.required}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
            >
              <option value="">Select an option</option>
              {field.options?.map((option: string) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        );
      
      case 'textarea':
        return (
          <div key={field.key} className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">
              {field.label} {field.required && <span className="text-red-500">*</span>}
            </label>
            <textarea
              name={field.key}
              value={formData[field.key] || ''}
              onChange={handleInputChange}
              required={field.required}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50"
              placeholder={`Enter ${field.label.toLowerCase()}`}
            />
          </div>
        );
      
      default:
        return (
          <Input
            key={field.key}
            label={field.label}
            name={field.key}
            type={field.type}
            value={formData[field.key] || ''}
            onChange={handleInputChange}
            required={field.required}
            placeholder={`Enter ${field.label.toLowerCase()}`}
          />
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-3xl"
      >
        <Card hover={false} className="relative overflow-hidden">
          {/* Event Image Banner */}
          {event.image_url && (
            <div className="relative h-48 md:h-64">
              <img
                src={event.image_url}
                alt={event.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-full bg-black/20 hover:bg-black/40 transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
          )}

          {/* Content */}
          <div className={`p-6 ${!event.image_url ? 'pt-4' : '-mt-16 relative'}`}>
            {!event.image_url && (
              <div className="flex justify-end mb-4">
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}

            <div className="space-y-6">
              {/* Event Details */}
              <div className={`space-y-4 ${event.image_url ? 'text-white' : 'text-gray-900'}`}>
                <h2 className="text-3xl font-bold">{event.title}</h2>
                <p className={event.image_url ? 'text-white/90' : 'text-gray-600'}>
                  {event.description}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-600">
                <div className="flex items-center">
                  <Calendar className="w-5 h-5 mr-2 text-blue-500" />
                  <span>{new Date(event.date).toLocaleDateString()}</span>
                </div>
                <div className="flex items-center">
                  <Clock className="w-5 h-5 mr-2 text-blue-500" />
                  <span>{event.time}</span>
                </div>
                <div className="flex items-center">
                  <MapPin className="w-5 h-5 mr-2 text-blue-500" />
                  <span>{event.location}</span>
                </div>
                <div className="flex items-center">
                  <Users className="w-5 h-5 mr-2 text-blue-500" />
                  <span>{event.current_attendees} / {event.max_attendees} spots</span>
                </div>
              </div>

              {step === 'details' && (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Registration Fields */}
                  {event.registration_fields && event.registration_fields.length > 0 && (
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900">Registration Details</h3>
                      <div className="space-y-4">
                        {event.registration_fields.map((field) => renderField(field))}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex space-x-4 pt-4">
                    <Button type="submit" loading={loading} className="flex-1 bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800">
                      {event.registration_fee > 0 ? 'Proceed to Payment' : 'Register NOW'}
                    </Button>
                    <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                      Cancel
                    </Button>
                  </div>
                </form>
              )}

              {step === 'payment' && (
                <div className="space-y-6">
                  <div className="bg-blue-50 p-6 rounded-xl space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900">Payment Details</h3>
                      <div className="flex items-center text-blue-600">
                        <CreditCard className="w-5 h-5 mr-2" />
                        <span className="font-semibold">₹{event.registration_fee}</span>
                      </div>
                    </div>

                    {event.bank_details?.account_number && (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="block text-gray-500">Account Holder</span>
                            <span className="font-medium text-gray-900">{event.bank_details.account_holder}</span>
                          </div>
                          <div>
                            <span className="block text-gray-500">Bank Name</span>
                            <span className="font-medium text-gray-900">{event.bank_details.bank_name}</span>
                          </div>
                          <div>
                            <span className="block text-gray-500">Account Number</span>
                            <span className="font-medium text-gray-900">{event.bank_details.account_number}</span>
                          </div>
                          <div>
                            <span className="block text-gray-500">IFSC Code</span>
                            <span className="font-medium text-gray-900">{event.bank_details.ifsc_code}</span>
                          </div>
                        </div>

                        {event.bank_details.qr_code_url && (
                          <div className="flex flex-col items-center space-y-3 pt-4">
                            <span className="text-sm font-medium text-gray-900">Scan QR Code to Pay</span>
                            <div className="bg-white p-3 rounded-xl shadow-sm">
                              <img
                                src={event.bank_details.qr_code_url}
                                alt="Payment QR Code"
                                className="h-48 w-48 object-contain"
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="flex space-x-4">
                    <Button type="button" onClick={() => setStep('details')} variant="outline" className="flex-1">
                      Back
                    </Button>
                    <Button
                      type="button"
                      onClick={handleSubmit}
                      loading={loading}
                      className="flex-1 bg-gradient-to-r from-blue-500 to-blue-700 hover:from-blue-600 hover:to-blue-800"
                    >
                      {loading ? 'Registering...' : 'Complete Registration'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default RegistrationModal; 