import { TrendingUp, DollarSign, CreditCard, PieChart } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, ResponsiveContainer, Tooltip, BarChart, Bar } from 'recharts';

const FinanceModule = () => {
  // Mock data
  const portfolioData = [
    { date: 'Jan', value: 25000 },
    { date: 'Feb', value: 26200 },
    { date: 'Mar', value: 24800 },
    { date: 'Apr', value: 27500 },
    { date: 'May', value: 29000 },
    { date: 'Jun', value: 31200 },
    { date: 'Jul', value: 32800 },
  ];

  const spendingData = [
    { category: 'Food', amount: 850 },
    { category: 'Transport', amount: 320 },
    { category: 'Entertainment', amount: 180 },
    { category: 'Bills', amount: 1200 },
  ];

  const currentPortfolio = 2875890;
  const monthlyChange = 1600;
  const totalSpending = spendingData.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="dashboard-card p-6 h-full">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg bg-finance/10">
          <TrendingUp className="h-6 w-6 text-finance" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Finance</h2>
          <p className="text-sm text-muted-foreground">Portfolio & spending</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Portfolio Value */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-finance" />
              <span className="metric-label">Portfolio</span>
            </div>
            <div className="text-right">
              <div className="metric-value text-finance">₹{currentPortfolio.toLocaleString()}</div>
              <div className="text-xs text-finance-light">+₹{monthlyChange}</div>
            </div>
          </div>
          <div className="h-24">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={portfolioData}>
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="hsl(var(--finance))" 
                  fill="hsl(var(--finance))"
                  fillOpacity={0.1}
                  strokeWidth={2}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  formatter={(value) => [`₹${value.toLocaleString()}`, 'Portfolio']}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Spending */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-finance" />
              <span className="metric-label">Monthly Spending</span>
            </div>
            <span className="metric-value text-finance">₹{totalSpending.toLocaleString()}</span>
          </div>
          <div className="h-24">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={spendingData} layout="horizontal">
                <Bar dataKey="amount" fill="hsl(var(--finance))" radius={[0, 2, 2, 0]} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px'
                  }}
                  formatter={(value) => [`₹${value}`, 'Amount']}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
          <div className="text-center">
            <div className="text-sm text-muted-foreground">P/L This Month</div>
            <div className="text-lg font-bold text-finance">+5.1%</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-muted-foreground">Savings Rate</div>
            <div className="text-lg font-bold text-finance">28%</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FinanceModule;