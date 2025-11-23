import { useState, useEffect } from "react";
import { BsClock } from "react-icons/bs";

export default function HospitalCalendarView({ appointments = [], selectedHospitalId, onDateSelect }) {
    // Filter appointments by selected hospital
    const hospitalAppointments = selectedHospitalId 
        ? appointments.filter(app => app.id === parseInt(selectedHospitalId))
        : [];

    // Get all dates for the selected hospital
    const getHospitalDates = () => {
        if (hospitalAppointments.length === 0) return [];
        
        const hospital = hospitalAppointments[0];
        if (!hospital.availableSlots || hospital.availableSlots.length === 0) return [];
        
        return hospital.availableSlots.map(slot => ({
            date: slot.date,
            times: slot.times,
            availableCount: slot.times.filter(t => t.available).length,
            totalCount: slot.times.length
        }));
    };

    const hospitalDates = getHospitalDates();

    // Initialize to the first month that has dates, or current month
    const getInitialMonth = () => {
        if (hospitalDates.length > 0 && hospitalDates[0].date) {
            const firstDate = new Date(hospitalDates[0].date + 'T00:00:00');
            return new Date(firstDate.getFullYear(), firstDate.getMonth(), 1);
        }
        return new Date();
    };

    const [currentMonth, setCurrentMonth] = useState(getInitialMonth());
    const [selectedDate, setSelectedDate] = useState(null);

    // Reset selected date and month when hospital changes
    useEffect(() => {
        setSelectedDate(null);
        if (hospitalDates.length > 0 && hospitalDates[0].date) {
            const firstDate = new Date(hospitalDates[0].date + 'T00:00:00');
            setCurrentMonth(new Date(firstDate.getFullYear(), firstDate.getMonth(), 1));
        } else {
            setCurrentMonth(new Date());
        }
    }, [selectedHospitalId, hospitalDates.length]);

    // Calendar helper functions
    const getDaysInMonth = (date) => {
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDay = new Date(year, month, 1);
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();
        const startingDayOfWeek = firstDay.getDay();
        
        return { daysInMonth, startingDayOfWeek, year, month };
    };

    const getDateInfo = (date) => {
        const dateStr = date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
        return hospitalDates.find(d => d.date === dateStr);
    };

    const changeMonth = (increment) => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + increment, 1));
        setSelectedDate(null); // Clear selection when changing months
    };

    const goToToday = () => {
        setCurrentMonth(new Date());
        setSelectedDate(null);
    };

    const handleDateClick = (date) => {
        const dateInfo = getDateInfo(date);
        if (dateInfo && dateInfo.times.length > 0) {
            setSelectedDate(date.toISOString().split('T')[0]);
            if (onDateSelect) {
                onDateSelect(date.toISOString().split('T')[0], dateInfo.times);
            }
        }
    };

    // Count dates in current month
    const datesInMonth = hospitalDates.filter(dateInfo => {
        if (!dateInfo.date) return false;
        const date = new Date(dateInfo.date + 'T00:00:00');
        return date.getFullYear() === currentMonth.getFullYear() &&
               date.getMonth() === currentMonth.getMonth();
    }).length;

    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"];

    const { daysInMonth, startingDayOfWeek, year, month } = getDaysInMonth(currentMonth);
    const days = [];

    // Empty cells before first day
    for (let i = 0; i < startingDayOfWeek; i++) {
        days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dateInfo = getDateInfo(date);
        const isToday = date.toDateString() === new Date().toDateString();
        const hasSlots = dateInfo && dateInfo.times.length > 0;
        const isSelected = selectedDate === date.toISOString().split('T')[0];

        days.push(
            <div 
                key={day} 
                className={`calendar-day ${isToday ? 'today' : ''} ${!hasSlots ? 'muted-day' : ''} ${isSelected ? 'selected-day' : ''} ${hasSlots ? 'clickable' : ''}`}
                onClick={() => hasSlots && handleDateClick(date)}
                style={{ cursor: hasSlots ? 'pointer' : 'default' }}
            >
                <div className="day-number">{day}</div>
                {hasSlots ? (
                    <div className="day-slots">
                        <span className="slot-count">
                            {dateInfo.availableCount}/{dateInfo.totalCount} available
                        </span>
                    </div>
                ) : (
                    <div className="no-slots">
                        <small>No slots</small>
                    </div>
                )}
            </div>
        );
    }

    // Get timeslots for selected date
    const selectedDateInfo = selectedDate ? getDateInfo(new Date(selectedDate + 'T00:00:00')) : null;

    return (
        <div className="calendar-view">
            <div className="calendar-header">
                <button onClick={() => changeMonth(-1)} className="calendar-nav-btn">‹</button>
                <div className="calendar-header-center">
                    <h3>{monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}</h3>
                    {datesInMonth > 0 && (
                        <span className="month-order-count">{datesInMonth} date{datesInMonth !== 1 ? 's' : ''} with slots this month</span>
                    )}
                </div>
                <div className="calendar-header-actions">
                    <button onClick={goToToday} className="today-btn">Today</button>
                    <button onClick={() => changeMonth(1)} className="calendar-nav-btn">›</button>
                </div>
            </div>
            <div className="calendar-grid">
                <div className="calendar-day-names">
                    <div>Sun</div>
                    <div>Mon</div>
                    <div>Tue</div>
                    <div>Wed</div>
                    <div>Thu</div>
                    <div>Fri</div>
                    <div>Sat</div>
                </div>
                <div className="calendar-days">
                    {days}
                </div>
            </div>

            {/* Timeslots for selected date */}
            {selectedDate && selectedDateInfo && selectedDateInfo.times.length > 0 && (
                <div className="selected-date-timeslots">
                    <h4>Available Time Slots for {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                    })}</h4>
                    <div className="timeslots-grid">
                        {selectedDateInfo.times.map((timeSlot, idx) => (
                            <div 
                                key={idx} 
                                className={`time-slot-calendar ${timeSlot.available ? 'available' : 'booked'}`}
                            >
                                <BsClock />
                                <span>{timeSlot.time}</span>
                                {!timeSlot.available && (
                                    <span className="booked-label">Booked</span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {!selectedHospitalId && (
                <div className="no-hospital-selected">
                    <p>Please select a hospital to view appointment calendar</p>
                </div>
            )}

            {selectedHospitalId && hospitalDates.length === 0 && (
                <div className="no-dates-available">
                    <p>No appointment dates available for this hospital</p>
                </div>
            )}
        </div>
    );
}

