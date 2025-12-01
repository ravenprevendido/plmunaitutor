// TeacherQuizOverview.jsx
import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from "recharts";

const data = [
  { quiz: "Quiz 1: Algebra", avgScore: 82 },
  { quiz: "Quiz 2: Geometry", avgScore: 76 },
  { quiz: "Quiz 3: Calculus", avgScore: 88 },
  { quiz: "Quiz 4: Statistics", avgScore: 65 },
  { quiz: "Quiz 5: Trigonometry", avgScore: 79 },
];

const TeacherCharts = () => {
  return (
    <div className="bg-[#13181F] border border-[#232935] p-6 rounded-xl">
      <h3 className="text-white text-lg font-semibold mb-1">
        Quiz Overview: Average Scores
      </h3>
      <p className="text-gray-400 text-sm mb-4">
        Average student performance on recent quizzes.
      </p>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={data}
          margin={{ top: 10, right: 30, left: 0, bottom: 50 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#2d3748" />
          <XAxis
            dataKey="quiz"
            tick={{ fill: "#cbd5e1", fontSize: 12 }}
            interval={0}
            angle={-25}
            textAnchor="end"
            height={70}
          />
          <YAxis
            tick={{ fill: "#cbd5e1", fontSize: 12 }}
            domain={[0, 100]}
            tickFormatter={(value) => `${value}%`}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "#1e293b",
              border: "1px solid #374151",
              color: "#f8fafc",
            }}
          />
          <Legend wrapperStyle={{ color: "#e2e8f0" }} />
          <ReferenceLine y={70} stroke="red" strokeDasharray="3 3" label="70%" />
          <Bar dataKey="avgScore" fill="#b88a5e" name="Average Score" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default TeacherCharts;
