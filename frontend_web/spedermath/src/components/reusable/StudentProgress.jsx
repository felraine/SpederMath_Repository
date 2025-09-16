import React, { useState, useMemo } from "react";
import ReactApexChart from "react-apexcharts";

const StudentProgress = ({ lessonStats = [], isLoading }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  const chartsPerPage = 4;

  // Stable color per lesson via hashed hue
  const hashHue = (str) => {
    let h = 0;
    for (let i = 0; i < (str || "").length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
    return h % 360;
  };
  const colorFor = (title, i) => `hsl(${hashHue(title || String(i))}, 70%, 60%)`;

  const getColoredData = (stats, key) =>
    stats.map((l, index) => ({
      x: l.title || `Lesson ${index + 1}`,
      y: Number.isFinite(l?.[key]) ? l[key] : 0,
      fillColor: colorFor(l.title, index),
    }));

  const coloredData = useMemo(
    () => ({
      avgScore: getColoredData(lessonStats, "avgScore"),
      retakesCount: getColoredData(lessonStats, "retakesCount"),
      avgTimeSpent: getColoredData(lessonStats, "avgTimeSpent"),
    }),
    [lessonStats]
  );

  const safeLesson = lessonStats[currentLessonIndex] || {};
  const chartGroups = [
    {
      title: "Average Score Per Lesson",
      series: [{ name: "Average Score", data: coloredData.avgScore }],
      pie: false,
    },
    {
      title: "Retake Attempts",
      series: [{ name: "Retake Attempts Per Lesson", data: coloredData.retakesCount }],
      pie: false,
    },
    {
      title: `Lesson Status: ${safeLesson.title || ""}`,
      pie: true,
      series: [
        safeLesson.completedCount || 0,
        safeLesson.inProgressCount || 0,
        safeLesson.notStartedCount || 0,
        safeLesson.failedCount || 0,
      ],
    },
    {
      title: "Average Time Spent Per Lesson",
      series: [{ name: "Avg Time Spent", data: coloredData.avgTimeSpent }],
      pie: false,
    },
  ];

  const totalPages = Math.ceil(chartGroups.length / chartsPerPage) || 1;

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
      categories: lessonStats.map((lesson, i) => {
        const t = lesson?.title || `L${i + 1}`;
        return t.length > 6 ? t.slice(0, 6) + "…" : t;
      }),
      labels: { rotate: 0, style: { fontSize: "12px", whiteSpace: "nowrap" } },
      tooltip: { enabled: false },
    },
    tooltip: {
      enabled: true,
      y: { formatter: (val) => val },
    },
  };

  const pieOptions = {
    chart: { type: "pie" },
    labels: ["Completed", "In Progress", "Not Started", "Failed"],
    colors: ["#22c55e", "#3b82f6", "#fbbf24", "#ef4444"],
    legend: { position: "right" },
  };

  const handleNextPage = () => setCurrentPage((p) => (p + 1) % totalPages);
  const handlePrevPage = () => setCurrentPage((p) => (p - 1 + totalPages) % totalPages);

  const handleNextLesson = () =>
    setCurrentLessonIndex((p) => (lessonStats.length ? (p + 1) % lessonStats.length : 0));
  const handlePrevLesson = () =>
    setCurrentLessonIndex((p) =>
      lessonStats.length ? (p - 1 + lessonStats.length) % lessonStats.length : 0
    );

  return (
    <section className="lg:col-span-2 bg-white p-4 shadow-md rounded-md h-full overflow-hidden flex flex-col">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold text-left flex-1">
          Student Progress
        </h3>
        <div className="space-x-2">
          <button
            onClick={handlePrevPage}
            disabled={totalPages <= 1}
            className={`px-2 py-1 text-white text-sm rounded-md ${
              totalPages <= 1 ? "bg-gray-300 cursor-not-allowed" : "bg-gray-500"
            }`}
          >
            ←
          </button>
          <button
            onClick={handleNextPage}
            disabled={totalPages <= 1}
            className={`px-2 py-1 text-white text-sm rounded-md ${
              totalPages <= 1 ? "bg-gray-300 cursor-not-allowed" : "bg-gray-500"
            }`}
          >
            →
          </button>
        </div>
      </div>

      <div
        className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1 max-h-[500px] overflow-y-auto scrollbar-hide"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {isLoading ? (
          [...Array(chartsPerPage)].map((_, index) => (
            <div
              key={index}
              className="bg-gray-100 rounded-md p-2 flex flex-col justify-between animate-pulse"
              style={{ height: index === 2 ? "auto" : "200px" }}
            >
              <div className="h-5 bg-gray-300 rounded w-3/4 mb-4" />
              <div className="flex-1 bg-gray-300 rounded" />
              {index === 2 && (
                <div className="mt-2 h-6 bg-gray-300 rounded w-full max-w-[250px] mx-auto" />
              )}
            </div>
          ))
        ) : lessonStats.length === 0 ? (
          <div className="col-span-2 flex justify-center items-center">
            <p className="text-gray-500 text-center">No assessment progress yet.</p>
          </div>
        ) : (
          chartGroups
            .slice(currentPage * chartsPerPage, (currentPage + 1) * chartsPerPage)
            .map((group, index) => (
              <div
                key={index}
                className={`bg-gray-100 rounded-md p-2 ${
                  group.pie ? "col-span-1" : ""
                } flex flex-col justify-between`}
                style={group.pie ? { height: "auto" } : { height: "200px" }}
              >
                <h4 className="text-sm font-semibold text-center">{group.title}</h4>
                {group.pie ? (
                  <>
                    <div className="mx-auto" style={{ width: "250px", maxWidth: "100%" }}>
                      <ReactApexChart
                        options={pieOptions}
                        series={group.series}
                        type="pie"
                        height={200}
                      />
                    </div>
                    <div className="flex justify-between w-full px-4 mt-2">
                      <button
                        onClick={handlePrevLesson}
                        className="px-3 py-1 bg-gray-500 text-white rounded-md text-sm"
                      >
                        ←
                      </button>
                      <button
                        onClick={handleNextLesson}
                        className="px-3 py-1 bg-gray-500 text-white rounded-md text-sm"
                      >
                        →
                      </button>
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
            ))
        )}
      </div>
    </section>
  );
};

export default StudentProgress;
