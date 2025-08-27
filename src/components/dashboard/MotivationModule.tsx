import { Target, Calendar, Zap, CheckCircle2 } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';

const MotivationModule = () => {
  // Mock data
  const habitData = [
    { name: 'Workout', completed: 5, total: 7 },
    { name: 'Reading', completed: 6, total: 7 },
    { name: 'Meditation', completed: 4, total: 7 },
    { name: 'No Smoking', completed: 7, total: 7 },
  ];

  const goalProgress = [
    { goal: 'Weight Loss', current: 75, target: 70, unit: 'kg' },
    { goal: 'Reading', current: 8, target: 12, unit: 'books' },
    { goal: 'Interview Prep', current: 65, target: 100, unit: 'hours' },
  ];

  const upcomingEvents = [
    { title: 'Team Meeting', time: '10:00 AM', type: 'work' },
    { title: 'Gym Session', time: '6:00 PM', type: 'fitness' },
    { title: 'Doctor Appointment', time: '2:00 PM', type: 'health' },
  ];

  const getProgressColor = (current: number, target: number) => {
    const percentage = (current / target) * 100;
    if (percentage >= 90) return 'hsl(var(--fitness))';
    if (percentage >= 70) return 'hsl(var(--motivation))';
    return 'hsl(var(--finance))';
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'work': return '💼';
      case 'fitness': return '💪';
      case 'health': return '🏥';
      default: return '📅';
    }
  };

  return (
    <div className="dashboard-card p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-motivation/10">
          <Target className="h-6 w-6 text-motivation" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Goals & Motivation</h2>
          <p className="text-sm text-muted-foreground">Track habits, goals, and upcoming events</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Habit Tracker */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-motivation" />
            <h3 className="font-semibold">Weekly Habits</h3>
          </div>
          <div className="space-y-3">
            {habitData.map((habit, index) => {
              const percentage = (habit.completed / habit.total) * 100;
              return (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{habit.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {habit.completed}/{habit.total}
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className="h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${percentage}%`,
                        backgroundColor: percentage === 100 ? 'hsl(var(--fitness))' : 'hsl(var(--motivation))'
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Goal Progress */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-motivation" />
            <h3 className="font-semibold">Goal Progress</h3>
          </div>
          <div className="space-y-4">
            {goalProgress.map((goal, index) => {
              const percentage = Math.min((goal.current / goal.target) * 100, 100);
              return (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{goal.goal}</span>
                    <span className="text-xs text-muted-foreground">
                      {goal.current}/{goal.target} {goal.unit}
                    </span>
                  </div>
                  <div className="relative">
                    <div className="w-full bg-muted rounded-full h-3">
                      <div 
                        className="h-3 rounded-full transition-all duration-500"
                        style={{ 
                          width: `${percentage}%`,
                          backgroundColor: getProgressColor(goal.current, goal.target)
                        }}
                      />
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-xs font-medium text-white mix-blend-difference">
                        {Math.round(percentage)}%
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Upcoming Events */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-motivation" />
            <h3 className="font-semibold">Today's Events</h3>
          </div>
          <div className="space-y-3">
            {upcomingEvents.map((event, index) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                <div className="text-lg">{getEventIcon(event.type)}</div>
                <div className="flex-1">
                  <div className="text-sm font-medium">{event.title}</div>
                  <div className="text-xs text-muted-foreground">{event.time}</div>
                </div>
                <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MotivationModule;