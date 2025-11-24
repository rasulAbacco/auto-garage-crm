import React, { useState } from 'react';
import { Droplets, Clock, CheckCircle, TrendingUp, Users, Star, Calendar, AlertCircle } from 'lucide-react';

const WashDashboard = () => {
  const [selectedPeriod, setSelectedPeriod] = useState('today');

  const stats = [
    { icon: Droplets, label: 'Total Washes', value: '186', change: '+15%', color: 'from-cyan-500 to-blue-600' },
    { icon: Clock, label: 'In Progress', value: '12', change: '+5%', color: 'from-amber-500 to-orange-600' },
    { icon: CheckCircle, label: 'Completed', value: '174', change: '+18%', color: 'from-green-500 to-emerald-600' },
    { icon: Users, label: 'New Customers', value: '89', change: '+32%', color: 'from-purple-500 to-pink-600' },
  ];

  const activeWashes = [
    { id: '#WH3847', customer: 'Vikram Singh', vehicle: 'Honda City', type: 'Premium Wash', time: '15 mins', progress: 65 },
    { id: '#WH3846', customer: 'Ananya Iyer', vehicle: 'Hyundai i20', type: 'Basic Wash', time: '8 mins', progress: 85 },
    { id: '#WH3845', customer: 'Rohit Verma', vehicle: 'Toyota Innova', type: 'Deep Clean', time: '25 mins', progress: 45 },
    { id: '#WH3844', customer: 'Kavita Das', vehicle: 'Maruti Swift', type: 'Quick Wash', time: '5 mins', progress: 92 },
  ];

  const services = [
    { name: 'Premium Wash', bookings: 58, revenue: '₹17,400', rating: 4.8, color: 'from-blue-400 to-blue-600' },
    { name: 'Basic Wash', bookings: 72, revenue: '₹10,800', rating: 4.6, color: 'from-green-400 to-green-600' },
    { name: 'Deep Clean', bookings: 34, revenue: '₹20,400', rating: 4.9, color: 'from-purple-400 to-purple-600' },
    { name: 'Quick Wash', bookings: 22, revenue: '₹4,400', rating: 4.5, color: 'from-orange-400 to-orange-600' },
  ];

  const upcomingBookings = [
    { time: '11:00 AM', customer: 'Arjun Mehta', vehicle: 'BMW 3 Series', type: 'Premium' },
    { time: '11:30 AM', customer: 'Sanjana Roy', vehicle: 'Audi A4', type: 'Deep Clean' },
    { time: '12:00 PM', customer: 'Karthik Rao', vehicle: 'Honda Civic', type: 'Basic' },
    { time: '12:30 PM', customer: 'Neha Gupta', vehicle: 'Hyundai Creta', type: 'Premium' },
  ];

  return (
    <div className="min-h-screen pl-[7%] bg-gradient-to-br from-slate-50 via-cyan-50 to-blue-50 p-6">
      {/* Header */}
      <div className="mb-8 animate-fade-in">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
              Car Wash Dashboard
            </h1>
            <p className="text-gray-600 mt-1">Manage your car wash operations efficiently</p>
          </div>
          <div className="flex gap-2">
            {['today', 'week', 'month'].map((period) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${selectedPeriod === period
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg scale-105'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                  }`}
              >
                {period.charAt(0).toUpperCase() + period.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, index) => (
          <div
            key={index}
            className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 animate-slide-up"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-xl bg-gradient-to-r ${stat.color} text-white`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <span className="text-green-500 text-sm font-semibold flex items-center gap-1">
                <TrendingUp className="w-4 h-4" />
                {stat.change}
              </span>
            </div>
            <p className="text-gray-600 text-sm mb-1">{stat.label}</p>
            <p className="text-3xl font-bold text-gray-800">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Active Washes */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Active Washes</h2>
            <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
              {activeWashes.length} in progress
            </span>
          </div>
          <div className="space-y-4">
            {activeWashes.map((wash, index) => (
              <div
                key={index}
                className="p-4 rounded-xl bg-gradient-to-r from-cyan-50 to-blue-50 hover:from-cyan-100 hover:to-blue-100 transition-all duration-300 border border-cyan-200"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white font-bold">
                      {wash.customer.charAt(0)}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">{wash.customer}</p>
                      <p className="text-sm text-gray-600">{wash.vehicle}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-800">{wash.id}</p>
                    <p className="text-xs text-gray-500">{wash.type}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                      <span>Progress</span>
                      <span className="font-semibold">{wash.progress}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-500"
                        style={{ width: `${wash.progress}%` }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-1 text-sm font-medium text-cyan-600">
                    <Clock className="w-4 h-4" />
                    {wash.time}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Bookings */}
        <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Upcoming</h2>
          <div className="space-y-3">
            {upcomingBookings.map((booking, index) => (
              <div
                key={index}
                className="p-3 rounded-lg bg-gradient-to-r from-slate-50 to-cyan-50 border border-slate-200 hover:border-cyan-300 transition-all duration-300"
              >
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-cyan-600" />
                  <span className="font-semibold text-gray-800 text-sm">{booking.time}</span>
                </div>
                <p className="font-medium text-gray-800 text-sm">{booking.customer}</p>
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs text-gray-600">{booking.vehicle}</p>
                  <span className="text-xs px-2 py-1 bg-cyan-100 text-cyan-700 rounded-full font-medium">
                    {booking.type}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Services Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Service Performance</h2>
          <div className="space-y-5">
            {services.map((service, index) => (
              <div key={index} className="group">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${service.color}`} />
                    <p className="font-semibold text-gray-800 group-hover:text-cyan-600 transition-colors">
                      {service.name}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 text-amber-500">
                    <Star className="w-4 h-4 fill-current" />
                    <span className="text-sm font-semibold">{service.rating}</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                  <span>{service.bookings} bookings</span>
                  <span className="font-medium text-green-600">{service.revenue}</span>
                </div>
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full bg-gradient-to-r ${service.color} rounded-full transition-all duration-500`}
                    style={{ width: `${(service.bookings / 80) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl shadow-lg p-6 text-white hover:shadow-xl transition-all duration-300">
          <h2 className="text-2xl font-bold mb-6">Today's Insights</h2>
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-white/10 rounded-xl backdrop-blur-sm">
              <div>
                <p className="text-sm opacity-90 mb-1">Average Wait Time</p>
                <p className="text-2xl font-bold">12 mins</p>
              </div>
              <Clock className="w-10 h-10 opacity-80" />
            </div>
            <div className="flex items-center justify-between p-4 bg-white/10 rounded-xl backdrop-blur-sm">
              <div>
                <p className="text-sm opacity-90 mb-1">Customer Satisfaction</p>
                <p className="text-2xl font-bold">4.7/5.0</p>
              </div>
              <Star className="w-10 h-10 opacity-80 fill-current" />
            </div>
            <div className="flex items-center justify-between p-4 bg-white/10 rounded-xl backdrop-blur-sm">
              <div>
                <p className="text-sm opacity-90 mb-1">Today's Revenue</p>
                <p className="text-2xl font-bold">₹28,640</p>
              </div>
              <TrendingUp className="w-10 h-10 opacity-80" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <button className="bg-gradient-to-r from-cyan-500 to-cyan-600 text-white p-6 rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300">
          <Calendar className="w-8 h-8 mb-2" />
          <p className="font-semibold text-lg">New Booking</p>
          <p className="text-sm opacity-90">Schedule a wash</p>
        </button>
        <button className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300">
          <Droplets className="w-8 h-8 mb-2" />
          <p className="font-semibold text-lg">Start Wash</p>
          <p className="text-sm opacity-90">Begin new service</p>
        </button>
        <button className="bg-gradient-to-r from-purple-500 to-purple-600 text-white p-6 rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300">
          <AlertCircle className="w-8 h-8 mb-2" />
          <p className="font-semibold text-lg">Inventory</p>
          <p className="text-sm opacity-90">Check supplies</p>
        </button>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }
        .animate-slide-up {
          animation: slide-up 0.6s ease-out;
          animation-fill-mode: both;
        }
      `}</style>
    </div>
  );
};

export default WashDashboard;