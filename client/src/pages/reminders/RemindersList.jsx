// client/src/pages/reminders/RemindersList.jsx
import React, { useMemo, useState, useEffect } from 'react'
import { listReminders, upsertReminder, deleteReminder, listClients } from '../../lib/storage.js'
import SearchBar from '../../components/SearchBar.jsx'
import {
  FiBell,
  FiCalendar,
  FiUser,
  FiShield,
  FiAward,
  FiTrash2,
  FiCheckCircle,
  FiAlertCircle,
  FiClock,
  FiPlus,
  FiX,
  FiSend,
  FiMail,
  FiMessageSquare,
  FiSmartphone,
  FiRefreshCw,
  FiFilter,
  FiTrendingUp
} from 'react-icons/fi'
import { useTheme } from '../../contexts/ThemeContext'

// Notification channel configuration
const notificationChannels = [
  { value: 'SMS', label: 'SMS', icon: FiSmartphone, emoji: '📱', color: 'blue' },
  { value: 'Email', label: 'Email', icon: FiMail, emoji: '📧', color: 'purple' },
  { value: 'WhatsApp', label: 'WhatsApp', icon: FiMessageSquare, emoji: '💬', color: 'green' },
  { value: 'All', label: 'All Channels', icon: FiSend, emoji: '🔔', color: 'orange' }
];

// Get status of reminder based on date
const getReminderStatus = (date) => {
  if (!date) return { status: 'unknown', color: 'gray', label: 'No Date' };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const reminderDate = new Date(date);
  reminderDate.setHours(0, 0, 0, 0);
  const diffTime = reminderDate - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return { status: 'overdue', color: 'red', label: 'Overdue', icon: FiAlertCircle };
  } else if (diffDays === 0) {
    return { status: 'today', color: 'orange', label: 'Today', icon: FiClock };
  } else if (diffDays <= 7) {
    return { status: 'soon', color: 'yellow', label: `${diffDays} days`, icon: FiClock };
  } else if (diffDays <= 30) {
    return { status: 'upcoming', color: 'blue', label: `${diffDays} days`, icon: FiCalendar };
  } else {
    return { status: 'scheduled', color: 'green', label: `${diffDays} days`, icon: FiCheckCircle };
  }
};

// Reminder Card Component
const ReminderCard = ({ reminder, client, onMarkDone, onDelete, index }) => {
  const { isDark } = useTheme();

  const nextServiceStatus = getReminderStatus(reminder.nextService);
  const insuranceStatus = getReminderStatus(reminder.insuranceRenewal);
  const warrantyStatus = getReminderStatus(reminder.warrantyExpiry);

  const notificationChannel = notificationChannels.find(ch => ch.value === reminder.notify) || notificationChannels[0];
  const NextServiceIcon = nextServiceStatus.icon;

  return (
    <div
      className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl shadow-lg border transition-all duration-300 hover:shadow-2xl overflow-hidden`}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      {/* Status Bar */}
      <div className={`h-2 bg-gradient-to-r ${nextServiceStatus.status === 'overdue'
          ? 'from-red-500 to-red-600'
          : nextServiceStatus.status === 'today' || nextServiceStatus.status === 'soon'
            ? 'from-yellow-500 to-orange-500'
            : 'from-green-500 to-emerald-500'
        }`} />

      <div className="p-6">
        <div className="flex items-start gap-6">
          {/* Customer Badge */}
          <div className="flex-shrink-0">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center shadow-xl">
              <div className="text-center">
                <FiUser className="text-white mx-auto mb-1" size={24} />
                <p className="text-white text-xs font-bold">#{reminder.customerId}</p>
              </div>
            </div>
          </div>

          {/* Reminder Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {client?.fullName || `Customer #${reminder.customerId}`}
                </h3>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border-2 ${isDark
                      ? `bg-${nextServiceStatus.color}-900/30 text-${nextServiceStatus.color}-400 border-${nextServiceStatus.color}-700`
                      : `bg-${nextServiceStatus.color}-50 text-${nextServiceStatus.color}-700 border-${nextServiceStatus.color}-200`
                    }`}>
                    <NextServiceIcon size={14} />
                    {nextServiceStatus.label}
                  </span>
                  <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold ${isDark ? 'bg-gray-700 text-gray-300 border border-gray-600' : 'bg-gray-100 text-gray-700 border border-gray-300'
                    }`}>
                    {notificationChannel.emoji} {notificationChannel.label}
                  </span>
                </div>
              </div>
            </div>

            {/* Reminder Items Grid */}
            <div className="grid md:grid-cols-3 gap-4 mb-4">
              {/* Next Service */}
              <div className={`p-4 rounded-xl border-2 ${isDark
                  ? `bg-${nextServiceStatus.color}-900/20 border-${nextServiceStatus.color}-800/30`
                  : `bg-${nextServiceStatus.color}-50 border-${nextServiceStatus.color}-100`
                }`}>
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-8 h-8 rounded-lg ${isDark ? `bg-${nextServiceStatus.color}-900/40` : `bg-${nextServiceStatus.color}-500`
                    } flex items-center justify-center`}>
                    <FiBell className={`${isDark ? `text-${nextServiceStatus.color}-400` : 'text-white'}`} size={16} />
                  </div>
                  <p className={`text-xs font-semibold uppercase tracking-wide ${isDark ? `text-${nextServiceStatus.color}-400` : `text-${nextServiceStatus.color}-600`
                    }`}>
                    Next Service
                  </p>
                </div>
                <p className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {reminder.nextService ? new Date(reminder.nextService).toLocaleDateString() : 'Not Set'}
                </p>
              </div>

              {/* Insurance */}
              <div className={`p-4 rounded-xl border-2 ${reminder.insuranceRenewal
                  ? isDark
                    ? `bg-${insuranceStatus.color}-900/20 border-${insuranceStatus.color}-800/30`
                    : `bg-${insuranceStatus.color}-50 border-${insuranceStatus.color}-100`
                  : isDark ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'
                }`}>
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-8 h-8 rounded-lg ${reminder.insuranceRenewal
                      ? isDark ? `bg-${insuranceStatus.color}-900/40` : `bg-${insuranceStatus.color}-500`
                      : isDark ? 'bg-gray-800' : 'bg-gray-200'
                    } flex items-center justify-center`}>
                    <FiShield className={`${reminder.insuranceRenewal
                        ? isDark ? `text-${insuranceStatus.color}-400` : 'text-white'
                        : isDark ? 'text-gray-600' : 'text-gray-400'
                      }`} size={16} />
                  </div>
                  <p className={`text-xs font-semibold uppercase tracking-wide ${reminder.insuranceRenewal
                      ? isDark ? `text-${insuranceStatus.color}-400` : `text-${insuranceStatus.color}-600`
                      : isDark ? 'text-gray-500' : 'text-gray-500'
                    }`}>
                    Insurance
                  </p>
                </div>
                <p className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {reminder.insuranceRenewal ? new Date(reminder.insuranceRenewal).toLocaleDateString() : 'Not Set'}
                </p>
              </div>

              {/* Warranty */}
              <div className={`p-4 rounded-xl border-2 ${reminder.warrantyExpiry
                  ? isDark
                    ? `bg-${warrantyStatus.color}-900/20 border-${warrantyStatus.color}-800/30`
                    : `bg-${warrantyStatus.color}-50 border-${warrantyStatus.color}-100`
                  : isDark ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'
                }`}>
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-8 h-8 rounded-lg ${reminder.warrantyExpiry
                      ? isDark ? `bg-${warrantyStatus.color}-900/40` : `bg-${warrantyStatus.color}-500`
                      : isDark ? 'bg-gray-800' : 'bg-gray-200'
                    } flex items-center justify-center`}>
                    <FiAward className={`${reminder.warrantyExpiry
                        ? isDark ? `text-${warrantyStatus.color}-400` : 'text-white'
                        : isDark ? 'text-gray-600' : 'text-gray-400'
                      }`} size={16} />
                  </div>
                  <p className={`text-xs font-semibold uppercase tracking-wide ${reminder.warrantyExpiry
                      ? isDark ? `text-${warrantyStatus.color}-400` : `text-${warrantyStatus.color}-600`
                      : isDark ? 'text-gray-500' : 'text-gray-500'
                    }`}>
                    Warranty
                  </p>
                </div>
                <p className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {reminder.warrantyExpiry ? new Date(reminder.warrantyExpiry).toLocaleDateString() : 'Not Set'}
                </p>
              </div>
            </div>

            {/* Customer Contact Info */}
            {client && (
              <div className={`p-3 rounded-xl ${isDark ? 'bg-gray-700/30' : 'bg-gray-50'}`}>
                <div className="flex flex-wrap items-center gap-4 text-sm">
                  {client.phone && (
                    <div className="flex items-center gap-2">
                      <FiSmartphone className={isDark ? 'text-blue-400' : 'text-blue-600'} size={14} />
                      <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>{client.phone}</span>
                    </div>
                  )}
                  {client.email && (
                    <div className="flex items-center gap-2">
                      <FiMail className={isDark ? 'text-purple-400' : 'text-purple-600'} size={14} />
                      <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>{client.email}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex-shrink-0 flex flex-col gap-2">
            <button
              onClick={() => onMarkDone(reminder)}
              className={`p-3 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg ${isDark
                  ? 'bg-green-900/30 hover:bg-green-900/50 text-green-400 border-2 border-green-700/50 hover:border-green-600'
                  : 'bg-green-50 hover:bg-green-100 text-green-600 border-2 border-green-200 hover:border-green-300'
                }`}
              title="Mark as Done"
            >
              <FiCheckCircle size={20} />
            </button>
            <button
              onClick={() => onDelete(reminder.id)}
              className={`p-3 rounded-xl transition-all duration-200 shadow-md hover:shadow-lg ${isDark
                  ? 'bg-red-900/30 hover:bg-red-900/50 text-red-400 border-2 border-red-700/50 hover:border-red-600'
                  : 'bg-red-50 hover:bg-red-100 text-red-600 border-2 border-red-200 hover:border-red-300'
                }`}
              title="Delete Reminder"
            >
              <FiTrash2 size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Stats Card Component
const StatsCard = ({ title, value, icon: Icon, gradient, delay }) => {
  const { isDark } = useTheme();

  return (
    <div
      className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl p-6 shadow-lg border transform transition-all duration-300 hover:scale-105 hover:shadow-2xl`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className={`text-sm font-semibold uppercase tracking-wide mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            {title}
          </p>
          <p className={`text-4xl font-black ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {value}
          </p>
        </div>
        <div className={`w-16 h-16 bg-gradient-to-br ${gradient} rounded-2xl flex items-center justify-center shadow-xl`}>
          <Icon className="text-white" size={28} />
        </div>
      </div>
    </div>
  );
};

export default function RemindersList() {
  const [q, setQ] = useState('')
  const [form, setForm] = useState({
    customerId: '',
    nextService: '',
    insuranceRenewal: '',
    warrantyExpiry: '',
    notify: 'SMS'
  })
  const [showForm, setShowForm] = useState(false)
  const [filterStatus, setFilterStatus] = useState('all')
  const [reminders, setReminders] = useState([])
  const [clients, setClients] = useState([])
  const { isDark } = useTheme()

  useEffect(() => {
    setReminders(listReminders())
    setClients(listClients())
  }, [])

  const nameById = useMemo(() => {
    return Object.fromEntries(clients.map(c => [String(c.id), c.fullName]))
  }, [clients])

  const filtered = useMemo(() => {
    const term = q.toLowerCase()
    let results = reminders.filter(r =>
      [nameById[String(r.customerId)] || '', r.nextService, r.insuranceRenewal, r.warrantyExpiry, r.notify].some(v =>
        String(v).toLowerCase().includes(term)
      )
    )

    // Apply status filter
    if (filterStatus !== 'all') {
      results = results.filter(r => {
        const status = getReminderStatus(r.nextService);
        return status.status === filterStatus;
      });
    }

    return results;
  }, [q, reminders, nameById, filterStatus])

  // Calculate statistics
  const stats = useMemo(() => {
    const total = reminders.length;
    const overdue = reminders.filter(r => getReminderStatus(r.nextService).status === 'overdue').length;
    const today = reminders.filter(r => getReminderStatus(r.nextService).status === 'today').length;
    const upcoming = reminders.filter(r => {
      const status = getReminderStatus(r.nextService).status;
      return status === 'soon' || status === 'upcoming';
    }).length;

    return { total, overdue, today, upcoming };
  }, [reminders]);

  const submit = (e) => {
    e.preventDefault()
    const newReminder = { ...form, customerId: Number(form.customerId) }
    upsertReminder(newReminder)
    setReminders(prev => [...prev, newReminder])
    setForm({
      customerId: '',
      nextService: '',
      insuranceRenewal: '',
      warrantyExpiry: '',
      notify: 'SMS'
    })
    setShowForm(false)
  }

  const sendNotifications = (client, message) => {
    console.log(`SMS sent to ${client.fullName}: ${message}`)
    console.log(`Email sent to ${client.fullName}: ${message}`)
    console.log(`WhatsApp sent to ${client.fullName}: ${message}`)

    // Show success notification
    alert(`Notifications sent to ${client.fullName} via all channels!`)
  }

  const markServiceDone = (reminder) => {
    const client = clients.find(c => c.id === reminder.customerId)
    if (!client) return

    const completionMessage = `Your service has been completed. Thank you for your business!`
    sendNotifications(client, completionMessage)

    const currentDate = new Date(reminder.nextService)
    const nextDate = new Date(currentDate)
    nextDate.setMonth(currentDate.getMonth() + 6)
    const nextServiceDate = nextDate.toISOString().split('T')[0]

    const updatedReminder = {
      ...reminder,
      nextService: nextServiceDate
    }

    upsertReminder(updatedReminder)
    setReminders(prev => prev.map(r => r.id === reminder.id ? updatedReminder : r))

    const nextServiceMessage = `Your next service is scheduled for ${nextDate.toLocaleDateString()}. We look forward to seeing you then!`
    sendNotifications(client, nextServiceMessage)
  }

  const handleDelete = (id) => {
    if (window.confirm('Are you sure you want to delete this reminder?')) {
      deleteReminder(id)
      setReminders(prev => prev.filter(r => r.id !== id))
    }
  }

  return (
    <div className="space-y-6 lg:ml-16 p-6">
      {/* Header Section */}
      <div className={`relative overflow-hidden ${isDark ? 'bg-gradient-to-br from-gray-800 via-gray-700 to-gray-800' : 'bg-gradient-to-br from-orange-600 via-red-600 to-pink-600'} rounded-3xl p-8 shadow-2xl`}>
        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
              <FiBell className="text-white" size={32} />
            </div>
            <div>
              <h1 className="text-4xl font-black text-white mb-1">Reminders & Notifications</h1>
              <p className="text-white/90 text-lg">Stay on top of service schedules and renewals</p>
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full -ml-24 -mb-24" />
      </div>

      {/* Stats Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Reminders"
          value={stats.total}
          icon={FiBell}
          gradient="from-blue-500 to-blue-600"
          delay={0}
        />
        <StatsCard
          title="Overdue"
          value={stats.overdue}
          icon={FiAlertCircle}
          gradient="from-red-500 to-red-600"
          delay={100}
        />
        <StatsCard
          title="Due Today"
          value={stats.today}
          icon={FiClock}
          gradient="from-orange-500 to-orange-600"
          delay={200}
        />
        <StatsCard
          title="Upcoming"
          value={stats.upcoming}
          icon={FiTrendingUp}
          gradient="from-green-500 to-emerald-600"
          delay={300}
        />
      </div>

      {/* Search, Filter and Add Section */}
      <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-2xl p-6 shadow-xl border`}>
        <div className="flex flex-col lg:flex-row items-center gap-4">
          <div className="w-full lg:flex-1">
            <SearchBar
              value={q}
              onChange={setQ}
              placeholder="Search reminders by customer, date..."
            />
          </div>

          <div className="w-full lg:w-64">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className={`w-full px-4 py-3 rounded-xl font-medium transition-all duration-200 ${isDark
                  ? 'bg-gray-700 border-gray-600 text-white focus:bg-gray-600 focus:border-blue-500'
                  : 'bg-white border-gray-300 text-gray-900 focus:bg-gray-50 focus:border-blue-500'
                } border-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
            >
              <option value="all">All Status</option>
              <option value="overdue">Overdue</option>
              <option value="today">Due Today</option>
              <option value="soon">Due Soon (7 days)</option>
              <option value="upcoming">Upcoming (30 days)</option>
            </select>
          </div>

          <button
            onClick={() => setShowForm(!showForm)}
            className="w-full lg:w-auto bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white rounded-xl px-8 py-3 font-bold transition-all duration-200 shadow-lg hover:shadow-2xl flex items-center justify-center gap-2 transform hover:scale-105"
          >
            {showForm ? <FiX size={20} /> : <FiPlus size={20} />}
            {showForm ? 'Cancel' : 'Add Reminder'}
          </button>
        </div>
      </div>

      {/* Add Reminder Form */}
      {showForm && (
        <form
          onSubmit={submit}
          className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-3xl shadow-xl border overflow-hidden`}
        >
          <div className={`p-6 border-b ${isDark ? 'border-gray-700 bg-gradient-to-r from-gray-800 to-gray-700' : 'border-gray-200 bg-gradient-to-r from-orange-600 to-red-600'}`}>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
                <FiPlus className="text-white" size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Create New Reminder</h2>
                <p className="text-sm text-white/80">Set up service and renewal reminders</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {/* Customer */}
              <div>
                <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'} flex items-center gap-2`}>
                  <FiUser size={16} className={isDark ? 'text-blue-400' : 'text-blue-600'} />
                  Customer <span className="text-red-500">*</span>
                </label>
                <select
                  className={`w-full px-4 py-3 rounded-xl font-medium transition-all duration-200 ${isDark
                      ? 'bg-gray-700 border-gray-600 text-white focus:bg-gray-600 focus:border-blue-500'
                      : 'bg-white border-gray-300 text-gray-900 focus:bg-gray-50 focus:border-blue-500'
                    } border-2 focus:outline-none focus:ring-2 focus:ring-blue-500/20`}
                  value={form.customerId}
                  onChange={(e) => setForm({ ...form, customerId: e.target.value })}
                  required
                >
                  <option value="">Select customer</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.fullName} (#{c.id})
                    </option>
                  ))}
                </select>
              </div>

              {/* Next Service */}
              <div>
                <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'} flex items-center gap-2`}>
                  <FiBell size={16} className={isDark ? 'text-orange-400' : 'text-orange-600'} />
                  Next Service Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  className={`w-full px-4 py-3 rounded-xl font-medium transition-all duration-200 ${isDark
                      ? 'bg-gray-700 border-gray-600 text-white focus:bg-gray-600 focus:border-orange-500'
                      : 'bg-white border-gray-300 text-gray-900 focus:bg-gray-50 focus:border-orange-500'
                    } border-2 focus:outline-none focus:ring-2 focus:ring-orange-500/20`}
                  value={form.nextService}
                  onChange={(e) => setForm({ ...form, nextService: e.target.value })}
                  required
                />
              </div>

              {/* Insurance Renewal */}
              <div>
                <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'} flex items-center gap-2`}>
                  <FiShield size={16} className={isDark ? 'text-purple-400' : 'text-purple-600'} />
                  Insurance Renewal
                </label>
                <input
                  type="date"
                  className={`w-full px-4 py-3 rounded-xl font-medium transition-all duration-200 ${isDark
                      ? 'bg-gray-700 border-gray-600 text-white focus:bg-gray-600 focus:border-purple-500'
                      : 'bg-white border-gray-300 text-gray-900 focus:bg-gray-50 focus:border-purple-500'
                    } border-2 focus:outline-none focus:ring-2 focus:ring-purple-500/20`}
                  value={form.insuranceRenewal}
                  onChange={(e) => setForm({ ...form, insuranceRenewal: e.target.value })}
                />
              </div>

              {/* Warranty Expiry */}
              <div>
                <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'} flex items-center gap-2`}>
                  <FiAward size={16} className={isDark ? 'text-green-400' : 'text-green-600'} />
                  Warranty Expiry
                </label>
                <input
                  type="date"
                  className={`w-full px-4 py-3 rounded-xl font-medium transition-all duration-200 ${isDark
                      ? 'bg-gray-700 border-gray-600 text-white focus:bg-gray-600 focus:border-green-500'
                      : 'bg-white border-gray-300 text-gray-900 focus:bg-gray-50 focus:border-green-500'
                    } border-2 focus:outline-none focus:ring-2 focus:ring-green-500/20`}
                  value={form.warrantyExpiry}
                  onChange={(e) => setForm({ ...form, warrantyExpiry: e.target.value })}
                />
              </div>
            </div>

            {/* Notification Channels */}
            <div>
              <label className={`block text-sm font-semibold mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Notification Channel <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {notificationChannels.map(channel => (
                  <button
                    key={channel.value}
                    type="button"
                    onClick={() => setForm({ ...form, notify: channel.value })}
                    className={`p-4 rounded-xl border-2 transition-all duration-200 ${form.notify === channel.value
                        ? isDark
                          ? `bg-${channel.color}-900/30 border-${channel.color}-500 shadow-lg`
                          : `bg-${channel.color}-50 border-${channel.color}-500 shadow-lg`
                        : isDark
                          ? 'bg-gray-700/50 border-gray-600 hover:bg-gray-700'
                          : 'bg-white border-gray-300 hover:bg-gray-50'
                      }`}
                  >
                    <div className="text-3xl mb-2">{channel.emoji}</div>
                    <div className={`text-sm font-bold ${form.notify === channel.value
                        ? isDark ? 'text-white' : 'text-gray-900'
                        : isDark ? 'text-gray-400' : 'text-gray-600'
                      }`}>
                      {channel.label}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-4">
              <button
                type="submit"
                className="flex-1 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white rounded-xl px-8 py-4 font-bold text-lg transition-all duration-200 shadow-xl hover:shadow-2xl flex items-center justify-center gap-2"
              >
                <FiSend size={20} />
                Create Reminder
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Reminders List */}
      {filtered.length === 0 ? (
        <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-3xl p-16 text-center shadow-xl border`}>
          <div className={`w-32 h-32 mx-auto rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-100'} flex items-center justify-center mb-6`}>
            <FiBell className={`w-16 h-16 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
          </div>
          <h3 className={`text-2xl font-bold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {q || filterStatus !== 'all' ? 'No Matching Reminders' : 'No Reminders Yet'}
          </h3>
          <p className={`text-lg mb-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            {q || filterStatus !== 'all'
              ? 'Try adjusting your search or filter criteria'
              : 'Create your first reminder to stay on top of service schedules'}
          </p>
          {!showForm && !q && filterStatus === 'all' && (
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-3 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white px-8 py-4 rounded-xl font-bold text-lg transition-all duration-200 shadow-xl hover:shadow-2xl"
            >
              <FiPlus size={24} />
              Create First Reminder
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {filtered.map((reminder, index) => {
            const client = clients.find(c => c.id === reminder.customerId);
            return (
              <ReminderCard
                key={reminder.id}
                reminder={reminder}
                client={client}
                onMarkDone={markServiceDone}
                onDelete={handleDelete}
                index={index}
              />
            );
          })}
        </div>
      )}
    </div>
  )
}