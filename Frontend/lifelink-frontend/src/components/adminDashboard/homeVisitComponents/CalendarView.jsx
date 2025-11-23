import { useState } from "react";

export default function CalendarView({ orders, filteredOrders }) {
    // Initialize to the first month that has orders, or current month
    const getInitialMonth = () => {
        if (filteredOrders && filteredOrders.length > 0 && filteredOrders[0].date) {
            const firstOrderDate = new Date(filteredOrders[0].date + 'T00:00:00');
            return new Date(firstOrderDate.getFullYear(), firstOrderDate.getMonth(), 1);
        }
        return new Date();
    };

    const [currentMonth, setCurrentMonth] = useState(getInitialMonth());

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

    const getOrdersForDate = (date) => {
        return filteredOrders.filter(order => {
            if (!order.date) return false;
            // Parse the date properly (handle YYYY-MM-DD format)
            const orderDate = new Date(order.date + 'T00:00:00');
            
            // Compare year, month, and day separately for reliability
            return orderDate.getFullYear() === date.getFullYear() &&
                   orderDate.getMonth() === date.getMonth() &&
                   orderDate.getDate() === date.getDate();
        });
    };

    const changeMonth = (increment) => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + increment, 1));
    };

    const goToToday = () => {
        setCurrentMonth(new Date());
    };

    // Count orders in current month
    const ordersInMonth = filteredOrders.filter(order => {
        if (!order.date) return false;
        const orderDate = new Date(order.date + 'T00:00:00');
        return orderDate.getFullYear() === currentMonth.getFullYear() &&
               orderDate.getMonth() === currentMonth.getMonth();
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
        const dayOrders = getOrdersForDate(date);
        const isToday = date.toDateString() === new Date().toDateString();
        const hasOrders = dayOrders.length > 0;

        // Get unique donors and phlebotomists for this day
        const uniqueDonors = [...new Set(dayOrders.map(order => order.name))];
        const uniquePhlebotomists = [...new Set(dayOrders.map(order => order.phlebotomist).filter(Boolean))];

        days.push(
            <div key={day} className={`calendar-day ${isToday ? 'today' : ''} ${!hasOrders ? 'muted-day' : ''}`}>
                <div className="day-number">{day}</div>
                {hasOrders ? (
                    <div className="day-orders">
                        <span className="order-count">
                            {dayOrders.length} order{dayOrders.length !== 1 ? 's' : ''}
                        </span>
                        
                        {/* Show all appointments with time */}
                        <div className="appointments-list">
                            {dayOrders.map((order, idx) => (
                                <div key={idx} className={`order-item ${order.status}`}>
                                    <div className="appointment-time">{order.time}</div>
                                    <div className="appointment-info">
                                        <small className="donor-name">👤 {order.name}</small>
                                        {order.phlebotomist && (
                                            <small className="phlebotomist-name">💉 {order.phlebotomist}</small>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Summary section */}
                        {(uniqueDonors.length > 1 || uniquePhlebotomists.length > 1) && (
                            <div className="day-summary">
                                {uniqueDonors.length > 0 && (
                                    <small className="summary-text">
                                        Donors: {uniqueDonors.length}
                                    </small>
                                )}
                                {uniquePhlebotomists.length > 0 && (
                                    <small className="summary-text">
                                        Staff: {uniquePhlebotomists.length}
                                    </small>
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="no-appointments">
                        <small>No appointments</small>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="calendar-view">
            <div className="calendar-header">
                <button onClick={() => changeMonth(-1)} className="calendar-nav-btn">‹</button>
                <div className="calendar-header-center">
                    <h3>{monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}</h3>
                    {ordersInMonth > 0 && (
                        <span className="month-order-count">{ordersInMonth} order{ordersInMonth !== 1 ? 's' : ''} this month</span>
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
        </div>
    );
}

