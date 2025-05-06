import React, { useState, useMemo } from "react";
import ReactApexChart from "react-apexcharts";

const StudentProgress = ({ lessonStats }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);

  const chartsPerPage = 4;

  const generateUniqueColors = (count) => {
    const colors = new Set();
    while (colors.size < count) {
      const color = `hsl(${Math.floor(Math.random() * 360)}, 70%, 60%)`;
      colors.add(color);
    }
    return Array.from(colors);
  };

  const getColoredData = (stats, key) => {
    const colors = generateUniqueColors(stats.length);
    return stats.map((l, index) => ({
      x: l.title,
      y: l[key] || 0,
      fillColor: colors[index],
    }));
  };

  const coloredData = useMemo(() => ({
    avgScore: getColoredData(lessonStats, "avgScore"),
    retakesCount: getColoredData(lessonStats, "retakesCount"),
    avgTimeSpent: getColoredData(lessonStats, "avgTimeSpent"),
  }), [lessonStats]);

  const chartGroups = [
    {
      title: "Average Score Per Lesson",
      series: [{ name: "Average Score", data: coloredData.avgScore }],
    },
    {
      title: "Retake Attempts",
      series: [{ name: "Retake Attempts Per Lesson", data: coloredData.retakesCount }],
    },
    {
      title: `Lesson Status: ${lessonStats[currentLessonIndex].title}`,
      pie: true,
      series: [
        lessonStats[currentLessonIndex].completedCount,
        lessonStats[currentLessonIndex].inProgressCount,
        lessonStats[currentLessonIndex].notStartedCount,
        lessonStats[currentLessonIndex].failedCount,
      ],
    },
    {
      title: "Average Time Spent Per Lesson",
      series: [{ name: "Avg Time Spent", data: coloredData.avgTimeSpent }],
    },
  ];

  const totalPages = Math.ceil(chartGroups.length / chartsPerPage);

  const sharedBarOptions = {
    chart: { type: "bar", height: 200, toolbar: { show: false } },
    plotOptions: {
      bar: {
        horizontal: false,
        endingShape: "flat",
        columnWidth: "45%",
      },
    },
    dataLabels: { enabled: false },
    xaxis: {
      categories: lessonStats.map((lesson) => lesson.title),
    },
  };

  const pieOptions = {
    chart: { type: "pie" },
    labels: ["Completed", "In Progress", "Not Started", "Failed"],
    legend: { position: "right" },
  };

  const handleNextPage = () => {
    setCurrentPage((prev) => (prev + 1) % totalPages);
  };

  const handlePrevPage = () => {
    setCurrentPage((prev) => (prev - 1 + totalPages) % totalPages);
  };

  const handleNextLesson = () => {
    setCurrentLessonIndex((prev) => (prev + 1) % lessonStats.length);
  };

  const handlePrevLesson = () => {
    setCurrentLessonIndex((prev) => (prev - 1 + lessonStats.length) % lessonStats.length);
  };

  return (
    <section className="lg:col-span-2 bg-white p-4 shadow-md rounded-md h-full overflow-hidden flex flex-col">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold">Student Progress</h3>
        <div className="space-x-2">
          <button onClick={handlePrevPage} className="px-2 py-1 bg-gray-500 text-white text-sm rounded-md">←</button>
          <button onClick={handleNextPage} className="px-2 py-1 bg-gray-500 text-white text-sm rounded-md">→</button>
        </div>
      </div>

      <div
        className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1 max-h-[500px] overflow-y-auto scrollbar-hide"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {chartGroups.slice(currentPage * chartsPerPage, (currentPage + 1) * chartsPerPage).map((group, index) => (
          <div
            key={index}
            className={`bg-gray-100 rounded-md p-2 ${group.pie ? "col-span-1" : ""} flex flex-col justify-between`}
            style={group.pie ? { height: "auto" } : { height: "220px" }}
          >
            <h4 className="text-sm font-semibold text-center">{group.title}</h4>
            {group.pie ? (
              <>
                <ReactApexChart
                  options={pieOptions}
                  series={group.series}
                  type="pie"
                  height={200}
                />
                <div className="flex justify-between w-full px-4 mt-2">
                  <button onClick={handlePrevLesson} className="px-3 py-1 bg-gray-500 text-white rounded-md text-sm">←</button>
                  <button onClick={handleNextLesson} className="px-3 py-1 bg-gray-500 text-white rounded-md text-sm">→</button>
                </div>
              </>
            ) : (
              <ReactApexChart
                options={sharedBarOptions}
                series={group.series}
                type="bar"
                height={200}
              />
            )}
          </div>
        ))}
      </div>
    </section>
  );
};

export default StudentProgress;
