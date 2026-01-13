
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useJobData } from '../contexts/JobDataContext';
import ScreenWrapper from '../components/ScreenWrapper';
import { TrackedJob, ApplicationStatus } from '../types';
import {
    ChevronLeftIcon,
    BriefcaseIcon,
    CheckIcon,
    SparklesIcon
} from '../components/icons';

const STATUS_COLORS: Record<ApplicationStatus, string> = {
    [ApplicationStatus.SAVED]: 'bg-slate-400',
    [ApplicationStatus.APPLIED]: 'bg-blue-500',
    [ApplicationStatus.INTERVIEWING]: 'bg-amber-500',
    [ApplicationStatus.OFFER]: 'bg-green-500',
    [ApplicationStatus.REJECTED]: 'bg-red-400',
};

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

interface CalendarEvent {
    id: string;
    title: string;
    company: string;
    date: Date;
    type: 'deadline' | 'interview' | 'followup' | 'applied';
    status: ApplicationStatus;
    job: TrackedJob;
}

const InternshipCalendarScreen: React.FC = () => {
    const navigate = useNavigate();
    const { trackedJobs, showToast } = useJobData();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

    // Generate calendar events from tracked jobs
    const events = useMemo(() => {
        const eventList: CalendarEvent[] = [];

        trackedJobs.forEach(job => {
            // Add application date (if recently applied)
            if (job.status === ApplicationStatus.APPLIED ||
                job.status === ApplicationStatus.INTERVIEWING ||
                job.status === ApplicationStatus.OFFER) {
                // Simulate applied date as today minus random days for demo
                const appliedDate = new Date();
                appliedDate.setDate(appliedDate.getDate() - Math.floor(Math.random() * 14));

                eventList.push({
                    id: `applied-${job.id}`,
                    title: `Applied: ${job.title}`,
                    company: job.company,
                    date: appliedDate,
                    type: 'applied',
                    status: job.status,
                    job
                });
            }

            // Add follow-up reminder (7 days after applying)
            if (job.status === ApplicationStatus.APPLIED) {
                const followUpDate = new Date();
                followUpDate.setDate(followUpDate.getDate() + 7);

                eventList.push({
                    id: `followup-${job.id}`,
                    title: `Follow up: ${job.title}`,
                    company: job.company,
                    date: followUpDate,
                    type: 'followup',
                    status: job.status,
                    job
                });
            }

            // Add interview date (if interviewing)
            if (job.status === ApplicationStatus.INTERVIEWING) {
                const interviewDate = new Date();
                interviewDate.setDate(interviewDate.getDate() + Math.floor(Math.random() * 7) + 1);

                eventList.push({
                    id: `interview-${job.id}`,
                    title: `Interview: ${job.title}`,
                    company: job.company,
                    date: interviewDate,
                    type: 'interview',
                    status: job.status,
                    job
                });
            }
        });

        return eventList;
    }, [trackedJobs]);

    // Get calendar days for current month
    const calendarDays = useMemo(() => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();

        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);

        const days: (Date | null)[] = [];

        // Add empty cells for days before first of month
        for (let i = 0; i < firstDay.getDay(); i++) {
            days.push(null);
        }

        // Add all days of the month
        for (let i = 1; i <= lastDay.getDate(); i++) {
            days.push(new Date(year, month, i));
        }

        return days;
    }, [currentDate]);

    // Get events for a specific date
    const getEventsForDate = (date: Date): CalendarEvent[] => {
        return events.filter(event =>
            event.date.toDateString() === date.toDateString()
        );
    };

    // Get events for selected date
    const selectedDateEvents = useMemo(() => {
        if (!selectedDate) return [];
        return getEventsForDate(selectedDate);
    }, [selectedDate, events]);

    // Navigation
    const goToPrevMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
    };

    const goToNextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
    };

    const goToToday = () => {
        setCurrentDate(new Date());
        setSelectedDate(new Date());
    };

    const isToday = (date: Date) => {
        const today = new Date();
        return date.toDateString() === today.toDateString();
    };

    const isSelected = (date: Date) => {
        return selectedDate?.toDateString() === date.toDateString();
    };

    const getEventTypeColor = (type: string) => {
        switch (type) {
            case 'interview': return 'bg-amber-500';
            case 'deadline': return 'bg-red-500';
            case 'followup': return 'bg-blue-500';
            case 'applied': return 'bg-green-500';
            default: return 'bg-gray-500';
        }
    };

    const getEventTypeIcon = (type: string) => {
        switch (type) {
            case 'interview': return '🎤';
            case 'deadline': return '⏰';
            case 'followup': return '📧';
            case 'applied': return '✅';
            default: return '📌';
        }
    };

    return (
        <ScreenWrapper>
            <div className="space-y-6">
                {/* Header */}
                <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl p-6 text-white">
                    <h1 className="text-2xl font-bold">📅 Internship Calendar</h1>
                    <p className="opacity-90 mt-1">Track deadlines, interviews, and follow-ups</p>
                </div>

                {/* Calendar Navigation */}
                <div className="bg-white rounded-xl shadow-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                        <button
                            onClick={goToPrevMonth}
                            className="p-2 hover:bg-gray-100 rounded-lg transition"
                        >
                            <ChevronLeftIcon className="w-5 h-5" />
                        </button>

                        <div className="text-center">
                            <h2 className="text-xl font-bold text-gray-800">
                                {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
                            </h2>
                            <button
                                onClick={goToToday}
                                className="text-sm text-indigo-600 hover:underline"
                            >
                                Go to Today
                            </button>
                        </div>

                        <button
                            onClick={goToNextMonth}
                            className="p-2 hover:bg-gray-100 rounded-lg transition"
                        >
                            <ChevronLeftIcon className="w-5 h-5 rotate-180" />
                        </button>
                    </div>

                    {/* Days of Week Header */}
                    <div className="grid grid-cols-7 gap-1 mb-2">
                        {DAYS_OF_WEEK.map(day => (
                            <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                                {day}
                            </div>
                        ))}
                    </div>

                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 gap-1">
                        {calendarDays.map((date, index) => {
                            if (!date) {
                                return <div key={`empty-${index}`} className="h-20" />;
                            }

                            const dayEvents = getEventsForDate(date);
                            const hasEvents = dayEvents.length > 0;

                            return (
                                <button
                                    key={date.toISOString()}
                                    onClick={() => setSelectedDate(date)}
                                    className={`
                    h-20 p-1 rounded-lg border transition text-left align-top
                    ${isToday(date) ? 'border-indigo-500 border-2' : 'border-gray-200'}
                    ${isSelected(date) ? 'bg-indigo-50' : 'bg-white hover:bg-gray-50'}
                  `}
                                >
                                    <span className={`
                    text-sm font-medium block mb-1
                    ${isToday(date) ? 'text-indigo-600' : 'text-gray-700'}
                  `}>
                                        {date.getDate()}
                                    </span>

                                    {/* Event Dots */}
                                    <div className="flex flex-wrap gap-1">
                                        {dayEvents.slice(0, 3).map(event => (
                                            <span
                                                key={event.id}
                                                className={`w-2 h-2 rounded-full ${getEventTypeColor(event.type)}`}
                                                title={event.title}
                                            />
                                        ))}
                                        {dayEvents.length > 3 && (
                                            <span className="text-xs text-gray-500">+{dayEvents.length - 3}</span>
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Legend */}
                <div className="bg-white rounded-xl shadow-lg p-4">
                    <h3 className="font-semibold text-gray-700 mb-3">Legend</h3>
                    <div className="flex flex-wrap gap-4">
                        <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-green-500 mr-2"></span> Applied</div>
                        <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-amber-500 mr-2"></span> Interview</div>
                        <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-blue-500 mr-2"></span> Follow-up</div>
                        <div className="flex items-center"><span className="w-3 h-3 rounded-full bg-red-500 mr-2"></span> Deadline</div>
                    </div>
                </div>

                {/* Selected Date Events */}
                {selectedDate && (
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <h3 className="text-lg font-bold text-gray-800 mb-4">
                            Events on {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                        </h3>

                        {selectedDateEvents.length > 0 ? (
                            <div className="space-y-3">
                                {selectedDateEvents.map(event => (
                                    <div
                                        key={event.id}
                                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition cursor-pointer"
                                        onClick={() => navigate(`/job/${event.job.id}`, { state: { jobData: event.job } })}
                                    >
                                        <div className="flex items-center">
                                            <span className="text-2xl mr-3">{getEventTypeIcon(event.type)}</span>
                                            <div>
                                                <p className="font-semibold text-gray-800">{event.title}</p>
                                                <p className="text-sm text-gray-500">{event.company}</p>
                                            </div>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-white text-sm ${STATUS_COLORS[event.status]}`}>
                                            {event.status}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-400 text-center py-8">
                                No events on this date. Track more jobs to see them here!
                            </p>
                        )}
                    </div>
                )}

                {/* Upcoming Events Summary */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">📋 Upcoming Events</h3>
                    {events.filter(e => e.date >= new Date()).slice(0, 5).length > 0 ? (
                        <div className="space-y-2">
                            {events
                                .filter(e => e.date >= new Date())
                                .sort((a, b) => a.date.getTime() - b.date.getTime())
                                .slice(0, 5)
                                .map(event => (
                                    <div
                                        key={event.id}
                                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                                    >
                                        <div className="flex items-center">
                                            <span className="text-xl mr-3">{getEventTypeIcon(event.type)}</span>
                                            <div>
                                                <p className="font-medium text-gray-700 text-sm">{event.title}</p>
                                                <p className="text-xs text-gray-500">{event.company}</p>
                                            </div>
                                        </div>
                                        <span className="text-sm text-gray-500">
                                            {event.date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                        </span>
                                    </div>
                                ))}
                        </div>
                    ) : (
                        <p className="text-gray-400 text-center py-4">
                            No upcoming events. Start applying to jobs!
                        </p>
                    )}
                </div>
            </div>
        </ScreenWrapper>
    );
};

export default InternshipCalendarScreen;
