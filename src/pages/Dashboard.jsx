import React from 'react'
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { TrendingUp, Users, Wrench, IndianRupee, Clock, Calendar, AlertCircle, Star } from 'lucide-react'

// Mock data - replace with your actual data from storage
const mockClients = [
  { id: 1, name: 'John Smith', phone: '123-456-7890', email: 'john@example.com' },
  { id: 2, name: 'Sarah Johnson', phone: '234-567-8901', email: 'sarah@example.com' },
  { id: 3, name: 'Mike Wilson', phone: '345-678-9012', email: 'mike@example.com' },
  { id: 4, name: 'Lisa Brown', phone: '456-789-0123', email: 'lisa@example.com' },
  { id: 5, name: 'David Davis', phone: '567-890-1234', email: 'david@example.com' }
]

const mockServices = [
  { id: 1, clientId: 1, type: 'Oil Change', date: '2024-09-01', cost: 150, status: 'Completed' },
  { id: 2, clientId: 2, type: 'Brake Repair', date: '2024-09-02', cost: 300, status: 'In Progress' },
  { id: 3, clientId: 3, type: 'Engine Tune-up', date: '2024-09-03', cost: 450, status: 'Completed' },
  { id: 4, clientId: 4, type: 'Tire Rotation', date: '2024-09-04', cost: 80, status: 'Pending' },
  { id: 5, clientId: 1, type: 'AC Service', date: '2024-09-05', cost: 200, status: 'Completed' }
]

const mockBilling = [
  { id: 1, serviceId: 1, amount: 150, status: 'Paid', dueDate: '2024-09-01' },
  { id: 2, serviceId: 2, amount: 300, status: 'Pending', dueDate: '2024-09-15' },
  { id: 3, serviceId: 3, amount: 450, status: 'Paid', dueDate: '2024-09-03' },
  { id: 4, serviceId: 4, amount: 80, status: 'Overdue', dueDate: '2024-08-30' },
  { id: 5, serviceId: 5, amount: 200, status: 'Paid', dueDate: '2024-09-05' }
]

const mockReminders = [
  { id: 1, clientId: 1, message: 'Oil change due', date: '2024-10-01' },
  { id: 2, clientId: 2, message: 'Inspection reminder', date: '2024-10-15' },
  { id: 3, clientId: 3, message: 'Brake check', date: '2024-10-20' }
]

// Generate chart data
const generateRevenueData = () => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep']
  return months.map(month => ({
    month,
    revenue: Math.floor(Math.random() * 5000) + 2000,
    services: Math.floor(Math.random() * 30) + 10
  }))
}

const generateAppointmentData = () => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  return days.map(day => ({
    day,
    appointments: Math.floor(Math.random() * 25) + 5,
    completed: Math.floor(Math.random() * 20) + 3
  }))
}

const generateServiceTypes = () => [
  { name: 'Oil Change', value: 35, color: '#3B82F6' },
  { name: 'Brake Repair', value: 25, color: '#10B981' },
  { name: 'Engine Work', value: 20, color: '#F59E0B' },
  { name: 'Tire Service', value: 15, color: '#EF4444' },
  { name: 'Other', value: 5, color: '#8B5CF6' }
]

const StatCard = ({ title, value, change, icon: Icon, color = 'blue' }) => (
  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between mb-4">
      <div className={`p-3 rounded-xl bg-${color}-50`}>
        <Icon className={`w-6 h-6 text-${color}-600`} />
      </div>
      {change && (
        <div className={`flex items-center text-sm ${change > 0 ? 'text-green-600' : 'text-red-600'}`}>
          <TrendingUp className="w-4 h-4 mr-1" />
          {change > 0 ? '+' : ''}{change}%
        </div>
      )}
    </div>
    <h3 className="text-2xl font-bold text-gray-900 mb-1">{value}</h3>
    <p className="text-sm text-gray-500">{title}</p>
  </div>
)

const ChartCard = ({ title, children, subtitle }) => (
  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
    <div className="mb-6">
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      {subtitle && <p className="text-sm text-gray-500 mt-1">{subtitle}</p>}
    </div>
    {children}
  </div>
)

const AppointmentCard = ({ name, time, service, status, avatar }) => (
  <div className="flex items-center justify-between p-4 hover:bg-gray-50 rounded-xl transition-colors">
    <div className="flex items-center space-x-3">
      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
        {avatar}
      </div>
      <div>
        <p className="font-medium text-gray-900">{name}</p>
        <p className="text-sm text-gray-500">{service}</p>
      </div>
    </div>
    <div className="text-right">
      <p className="text-sm font-medium text-gray-900">{time}</p>
      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${status === 'Confirmed' ? 'bg-green-100 text-green-800' :
          status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
            'bg-blue-100 text-blue-800'
        }`}>
        {status}
      </span>
    </div>
  </div>
)

export default function Dashboard() {
  const revenueData = generateRevenueData()
  const appointmentData = generateAppointmentData()
  const serviceTypesData = generateServiceTypes()

  // Calculate stats
  const totalRevenue = mockBilling.filter(b => b.status === 'Paid').reduce((sum, b) => sum + b.amount, 0)
  const totalServices = mockServices.length
  const totalClients = mockClients.length
  const avgAppointmentTime = '2.5 hrs'
  const customerRating = 4.8
  const upcomingReminders = mockReminders.length

  return (
    <div className="min-h-screen lg:pl-64 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>
            <p className="text-gray-600 mt-1">Welcome back! Here's what's happening in your garage today.</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <p className="text-sm text-gray-500">Today</p>
              <p className="font-semibold text-gray-900">{new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}</p>
            </div>
            
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Revenue"
          value={`₹${totalRevenue.toLocaleString()}`}
          change={12}
          icon={IndianRupee}
          color="green"
        />
        <StatCard
          title="Total Services"
          value={totalServices}
          change={8}
          icon={Wrench}
          color="blue"
        />
        <StatCard
          title="Avg Service Time"
          value={avgAppointmentTime}
          change={-5}
          icon={Clock}
          color="orange"
        />
        <StatCard
          title="Customer Rating"
          value={customerRating}
          icon={Star}
          color="yellow"
        />
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Revenue Chart */}
        <div className="lg:col-span-2">
          <ChartCard title="Revenue & Services" subtitle="Monthly overview of revenue and completed services">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="servicesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" stroke="#666" fontSize={12} />
                <YAxis stroke="#666" fontSize={12} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="#3B82F6"
                  fillOpacity={1}
                  fill="url(#revenueGradient)"
                  strokeWidth={3}
                />
                <Area
                  type="monotone"
                  dataKey="services"
                  stroke="#10B981"
                  fillOpacity={1}
                  fill="url(#servicesGradient)"
                  strokeWidth={3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* Service Types Pie Chart */}
        <ChartCard title="Service Distribution" subtitle="Popular service types this month">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={serviceTypesData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="value"
              >
                {serviceTypesData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-4 space-y-2">
            {serviceTypesData.map((item, index) => (
              <div key={index} className="flex items-center justify-between text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                  <span className="text-gray-700">{item.name}</span>
                </div>
                <span className="font-medium text-gray-900">{item.value}%</span>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      {/* Secondary Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Weekly Appointments */}
        <ChartCard title="Weekly Appointments" subtitle="Appointments scheduled vs completed this week">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={appointmentData} barCategoryGap="20%">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="day" stroke="#666" fontSize={12} />
              <YAxis stroke="#666" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
              />
              <Bar dataKey="appointments" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="completed" fill="#10B981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Customer Overview */}
        <ChartCard title="Customer Overview" subtitle="New vs returning customers">
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">{totalClients}</div>
              <div className="text-sm text-gray-500">Total Customers</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">{upcomingReminders}</div>
              <div className="text-sm text-gray-500">Upcoming Reminders</div>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={150}>
            <LineChart data={revenueData.slice(0, 7)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" stroke="#666" fontSize={12} />
              <YAxis stroke="#666" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
              />
              <Line
                type="monotone"
                dataKey="services"
                stroke="#8B5CF6"
                strokeWidth={3}
                dot={{ fill: '#8B5CF6', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Appointments and Quick Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Appointments */}
        <div className="lg:col-span-2">
          <ChartCard title="Today's Appointments" subtitle="Scheduled appointments for today">
            <div className="space-y-1">
              <AppointmentCard
                name="John Smith"
                time="9:00 AM"
                service="Oil Change"
                status="Confirmed"
                avatar="JS"
              />
              <AppointmentCard
                name="Sarah Johnson"
                time="11:30 AM"
                service="Brake Inspection"
                status="In Progress"
                avatar="SJ"
              />
              <AppointmentCard
                name="Mike Wilson"
                time="2:00 PM"
                service="Engine Diagnostic"
                status="Pending"
                avatar="MW"
              />
              <AppointmentCard
                name="Lisa Brown"
                time="4:30 PM"
                service="Tire Rotation"
                status="Confirmed"
                avatar="LB"
              />
            </div>
          </ChartCard>
        </div>

        {/* Quick Stats */}
        <ChartCard title="Quick Stats" subtitle="Key metrics at a glance">
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Users className="w-5 h-5 text-blue-600" />
                </div>
                <span className="text-gray-700">Active Clients</span>
              </div>
              <span className="font-bold text-gray-900">{totalClients}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-green-50 rounded-lg">
                  <Wrench className="w-5 h-5 text-green-600" />
                </div>
                <span className="text-gray-700">Services This Month</span>
              </div>
              <span className="font-bold text-gray-900">{totalServices}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-orange-50 rounded-lg">
                  <Calendar className="w-5 h-5 text-orange-600" />
                </div>
                <span className="text-gray-700">Pending Reminders</span>
              </div>
              <span className="font-bold text-gray-900">{upcomingReminders}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-red-50 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                </div>
                <span className="text-gray-700">Overdue Bills</span>
              </div>
              <span className="font-bold text-gray-900">
                {mockBilling.filter(b => b.status === 'Overdue').length}
              </span>
            </div>
          </div>
        </ChartCard>
      </div>
    </div>
  )
}