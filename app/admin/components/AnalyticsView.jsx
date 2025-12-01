// components/admin/AnalyticsView.jsx
const AnalyticsView = () => {
  const stats = [
    { label: "Total Learning Hours", value: "1,234", change: "+12%" },
    { label: "Active Users", value: "892", change: "+5%" },
    { label: "Completion Rate", value: "78%", change: "+3%" },
    { label: "Avg. Score", value: "85%", change: "+2%" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-[#161b22] p-6 rounded-xl border border-gray-800">
            <h3 className="text-gray-400 text-sm">{stat.label}</h3>
            <p className="text-3xl font-bold text-green-500 mt-2">{stat.value}</p>
            <p className="text-xs text-green-400 mt-1">{stat.change} from last month</p>
          </div>
        ))}
      </div>
      
      <div className="bg-[#161b22] p-6 rounded-xl border border-gray-800">
        <h3 className="text-xl font-semibold text-white mb-4">Learning Analytics</h3>
        <div className="text-gray-400">
          <p>Detailed analytics and insights coming soon...</p>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsView;