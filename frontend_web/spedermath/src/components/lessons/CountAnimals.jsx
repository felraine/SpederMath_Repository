import React, { useState } from "react";
import LessonLayout from "../reusable/LessonLayout";

const CountAnimals = () => {
  const [selected, setSelected] = useState(null);

  const mainLessonPhase = [
    { image: "/cat.gif", choice: "3" },
    { image: "/cat.gif", choice: "2" },
    { image: "/cat.gif", choice: "4" },
  ];

  const handleChoice = (choice) => {
    setSelected(choice);
    // Add your logic here if needed
  };

  const submitProgress = () => {
    alert("Progress submitted!");
  };

  return (
    <LessonLayout
      lesson={{ lessonid: 2, title: "Count Animals" }}
      progress="Progress: 0/10"
    >
      <div className="flex flex-col items-center justify-center h-full">
        <h2 className="text-2xl font-bold mb-6">Count the Animals!</h2>

        {/* Horizontal arrangement */}
        <div className="flex flex-row items-center justify-center space-x-8 mb-6">
          {mainLessonPhase.map((item, index) => (
            <div key={index} className="flex flex-col items-center">
              <img
                src={item.image}
                alt={`Animal ${index + 1}`}
                className="w-32 h-32 mb-2"
              />
              <button
                onClick={() => handleChoice(item.choice)}
                className={`px-4 py-2 rounded-lg text-white ${
                  selected === item.choice ? "bg-green-500" : "bg-blue-500"
                }`}
              >
                {item.choice}
              </button>
            </div>
          ))}
        </div>
      </div>
    </LessonLayout>
  );
};

export default CountAnimals;
