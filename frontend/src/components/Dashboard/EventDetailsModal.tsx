import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  X,
  CreditCard,
  QrCode,
  User,
  Building2,
  Hash,
  Calendar,
  Clock,
  MapPin,
  Users,
  ClipboardList,
  CheckCircle,
  Info
} from 'lucide-react';
import Card from '../UI/Card';
import { apiClient } from '../../lib/api';

interface EventDetailsModalProps {
  event: any;
  onClose: () => void;
}

const EventDetailsModal: React.FC<EventDetailsModalProps> = ({ event, onClose }) => {
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'details' | 'registrations' | 'payment'>('details');

  useEffect(() => {
    if (activeTab === 'registrations') {
      fetchRegistrations();
    }
  }, [activeTab]);

  const fetchRegistrations = async () => {
    try {
      const data = await apiClient.getEventRegistrations(event.id);
      setRegistrations(data);
    } catch (error) {
      console.error('Error fetching registrations:', error);
    }
  };

  const TabButton = ({ tab, label, icon: Icon }: { tab: typeof activeTab, label: string, icon: any }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
        activeTab === tab
          ? 'bg-blue-50 text-blue-600'
          : 'text-gray-600 hover:bg-gray-50'
      }`}
    >
      <Icon className="w-4 h-4" />
      <span>{label}</span>
    </button>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-6xl my-8"
      >
        <Card hover={false} className="relative flex flex-col max-h-[85vh]">
          {/* Header */}
          <div className="flex justify-between items-center p-6 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-indigo-600">
            <h2 className="text-2xl font-bold text-white">{event.title}</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex space-x-2 p-4 border-b border-gray-200">
            <TabButton tab="details" label="Event Details" icon={Info} />
            <TabButton tab="registrations" label="Registrations" icon={ClipboardList} />
            {event.bank_details && (
              <TabButton tab="payment" label="Payment Details" icon={CreditCard} />
            )}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-gradient-to-b [&::-webkit-scrollbar-thumb]:from-blue-500 [&::-webkit-scrollbar-thumb]:to-indigo-600 [&::-webkit-scrollbar-thumb]:rounded-full">
            {activeTab === 'details' && (
              <div className="p-6 space-y-6">
                {/* Basic Information */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-center space-x-3 bg-white/50 p-4 rounded-lg">
                      <Calendar className="w-5 h-5 text-blue-500" />
                      <div>
                        <div className="text-sm font-medium text-gray-500">Date</div>
                        <div className="text-base font-medium text-gray-900">
                          {new Date(event.date).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 bg-white/50 p-4 rounded-lg">
                      <Clock className="w-5 h-5 text-blue-500" />
                      <div>
                        <div className="text-sm font-medium text-gray-500">Time</div>
                        <div className="text-base font-medium text-gray-900">{event.time}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 bg-white/50 p-4 rounded-lg">
                      <MapPin className="w-5 h-5 text-blue-500" />
                      <div>
                        <div className="text-sm font-medium text-gray-500">Location</div>
                        <div className="text-base font-medium text-gray-900">{event.location}</div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 bg-white/50 p-4 rounded-lg">
                      <Users className="w-5 h-5 text-blue-500" />
                      <div>
                        <div className="text-sm font-medium text-gray-500">Attendees</div>
                        <div className="text-base font-medium text-gray-900">
                          {event.current_attendees} / {event.max_attendees}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Description</h3>
                  <div className="bg-white/50 rounded-lg p-4">
                    <p className="text-gray-600 whitespace-pre-wrap">{event.description}</p>
                  </div>
                </div>

                {/* Registration Fields */}
                {event.registration_fields?.length > 0 && (
                  <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Registration Fields</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {event.registration_fields.map((field: any, index: number) => (
                        <div key={index} className="bg-white/60 p-4 rounded-lg border border-teal-100/50">
                          <div className="font-medium text-gray-900 mb-1">{field.label}</div>
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <span className="px-2 py-1 bg-teal-50 rounded text-teal-700">
                              {field.type}
                            </span>
                            {field.required && (
                              <span className="px-2 py-1 bg-red-50 rounded text-red-700">
                                Required
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'registrations' && (
              <div className="p-6">
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-900">Registrations</h3>
                    <span className="text-sm text-gray-500">
                      Total: {registrations.length}
                    </span>
                  </div>
                  <div className="overflow-x-auto [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-gray-100 [&::-webkit-scrollbar-thumb]:bg-gradient-to-r [&::-webkit-scrollbar-thumb]:from-blue-500 [&::-webkit-scrollbar-thumb]:to-indigo-600 [&::-webkit-scrollbar-thumb]:rounded-full">
                    <div className="inline-block min-w-full align-middle">
                      <table className="min-w-full divide-y divide-gray-200 bg-white rounded-lg">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Registered At</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {registrations.map((reg: any) => (
                            <tr key={reg.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{reg.full_name}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{reg.email}</td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  reg.checked_in_at
                                    ? 'bg-green-100 text-green-800'
                                    : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {reg.checked_in_at ? 'Checked In' : 'Registered'}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {new Date(reg.registered_at).toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'payment' && event.bank_details && (
              <div className="flex flex-col lg:flex-row">
                {/* Left Side - Bank Details */}
                <div className="flex-1 p-6">
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 space-y-6">
                    {event.registration_fee > 0 && (
                      <div className="flex items-center space-x-2">
                        <CreditCard className="w-5 h-5 text-green-600" />
                        <span className="text-green-800 font-medium">
                          Registration Fee: ₹{event.registration_fee}
                        </span>
                      </div>
                    )}

                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-900">Bank Details</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center space-x-3">
                          <User className="w-5 h-5 text-gray-400" />
                          <div>
                            <div className="text-sm text-gray-500">Account Holder</div>
                            <div className="font-medium text-gray-900">{event.bank_details.account_holder}</div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3">
                          <Building2 className="w-5 h-5 text-gray-400" />
                          <div>
                            <div className="text-sm text-gray-500">Bank Name</div>
                            <div className="font-medium text-gray-900">{event.bank_details.bank_name}</div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3">
                          <CreditCard className="w-5 h-5 text-gray-400" />
                          <div>
                            <div className="text-sm text-gray-500">Account Number</div>
                            <div className="font-medium text-gray-900">{event.bank_details.account_number}</div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3">
                          <Hash className="w-5 h-5 text-gray-400" />
                          <div>
                            <div className="text-sm text-gray-500">IFSC Code</div>
                            <div className="font-medium text-gray-900">{event.bank_details.ifsc_code}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Side - QR Code */}
                {event.bank_details.qr_code_url && (
                  <div className="w-full lg:w-80 p-6 lg:border-l border-gray-200">
                    <div className="sticky top-0">
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
                        <div className="flex flex-col items-center space-y-4">
                          <div className="flex items-center space-x-2 text-gray-700">
                            <QrCode className="w-5 h-5" />
                            <span className="font-medium">Scan QR Code to Pay</span>
                          </div>
                          <div className="bg-white p-4 rounded-lg shadow-sm">
                            <img
                              src={event.bank_details.qr_code_url}
                              alt="Payment QR Code"
                              className="w-full h-auto"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>
      </motion.div>
    </div>
  );
};

export default EventDetailsModal; 