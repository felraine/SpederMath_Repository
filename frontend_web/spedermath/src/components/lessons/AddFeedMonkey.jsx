import React, { useState, useEffect } from 'react';
import axios from 'axios';
import LessonLayout from '../reusable/LessonLayout';
import { useNavigate } from 'react-router-dom';

const generateBananaLessons = (total = 10) => {
    const lessons = [];
    for (let i = 0; i < total; i++) {
      const correct = Math.floor(Math.random() * 9) + 2; // 2 to 10 bananas
      const available = Math.floor(Math.random() * correct) + 1; // always less than correct
      lessons.push({ correct, available });
    }
    return lessons;
  };
const correctClickSound = () => new Audio('/correct-sound.mp3').play();
const incorrectClickSound = () => new Audio('/incorrect-sound.mp3').play();
const passedSound = () => new Audio('/passed-sound.mp3').play();
const failedSound = () => new Audio('/failed-sound.mp3').play();

const AddFeedMonkey = () => {
  const [lessons] = useState(generateBananaLessons());
  const [currentStep, setCurrentStep] = useState(0);
  const [addedFood, setAddedFood] = useState(0);
  const [score, setScore] = useState(0);
  const [status, setStatus] = useState('IN_PROGRESS');
  const [timeSpent, setTimeSpent] = useState(0);
  const lessonId = 3;
  const token = localStorage.getItem('token');
  const navigate = useNavigate();
  const current = lessons[currentStep];

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeSpent((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (status === 'COMPLETED') passedSound();
    else if (status === 'FAILED') failedSound();
  }, [status]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, '0');
    const secs = (seconds % 60).toString().padStart(2, '0');
    return `${mins}:${secs}`;
  };

  const handleAddFood = () => {
    setAddedFood(prev => prev + 1);
  };

  const handleFeedMonkey = () => {
    const isCorrect = addedFood + current.available === current.correct;
    const nextScore = isCorrect ? score + 1 : score;

    isCorrect ? correctClickSound() : incorrectClickSound();

    setTimeout(() => {
      if (currentStep + 1 >= lessons.length) {
        setStatus(nextScore >= 4 ? 'COMPLETED' : 'FAILED');
        setScore(nextScore);
      } else {
        setScore(nextScore);
        setCurrentStep(prev => prev + 1);
        setAddedFood(0);
      }
    }, 1000);
  };

  const submitProgress = async () => {
    const progress = {
      score,
      status,
      timeSpentInSeconds: timeSpent,
      lessonId,
    };

    try {
      await axios.post('http://localhost:8080/api/student-progress/submit', progress, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert('Progress submitted!');
      navigate('/student-dashboard');
    } catch (error) {
      alert('Failed to submit progress');
      console.error(error);
    }
  };

  return (
    <LessonLayout

  lesson={{ lessonid: 3, title: 'Feed the Monkey' }}
  progress={`${currentStep + 1}/${lessons.length}`}
>
  {/* ✅ Timer untouched, top-right */}
  <div className="absolute top-4 right-6 bg-white rounded-full px-4 py-1 text-gray-700 font-neucha text-lg shadow-md border">
    Time: {formatTime(timeSpent)}
  </div>

  {status === 'COMPLETED' || status === 'FAILED' ? (
    <div className="fixed inset-0 flex items-center justify-center backdrop-blur-sm bg-black/30 z-50">
      <div className="bg-[#fffaf0] rounded-3xl p-10 max-w-xl w-full text-center shadow-2xl border-4 border-[#f1f2f6]">
        <h2 className="text-[42px] font-comic font-bold text-gray-800 mb-4">
          {score >= 4 ? 'Yay! Well fed!' : 'Keep Trying!'}
        </h2>
        <p className="text-[24px] font-neucha text-gray-700 mb-6">
          You got <span className="font-bold text-green-700">{score}</span> out of{' '}
          <span className="font-bold text-green-700">{lessons.length}</span> correct.
        </p>
        <button
          onClick={submitProgress}
          className="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-full text-lg font-comic shadow-md transition"
        >
          Return to Dashboard
        </button>
      </div>
    </div>
  ) : (
    <>
      {/*Header and banana count */}
      <div className="flex justify-between items-start px-4 sm:px-6">
        <h2 className="text-[20px] sm:text-[22px] font-neucha">
          Feed monkey {current.correct} bananas 🍌
        </h2>
        <div className="bg-white rounded-full px-4 py-1 text-gray-700 font-neucha text-lg shadow-md border">
          Bananas given:{' '}
          <span
            className={`font-bold ${
              current.available + addedFood > 10 ? 'text-red-600' : 'text-green-700'
            }`}
          >
            {current.available + addedFood}
          </span>
        </div>
      </div>

      {/* ✅ Monkey + Banana Images */}
      <div className="flex flex-col sm:flex-row justify-center items-center gap-10 px-4 sm:px-8 mb-10 mt-6">
        <img src="/monkey.gif" alt="monkey" className="h-52 sm:h-64 sm:mr-4" />

        <div className="grid grid-cols-5 gap-2 max-w-full items-center justify-center">
      {/* Default bananas */}
      {[...Array(current.available)].map((_, i) => (
        <img
          key={`default-${i}`}
          src="/banana.png"
          alt="banana"
          className="h-14 w-14 sm:h-16 sm:w-16 object-contain"
        />
      ))}

      {/* Plus symbol */}
      {addedFood > 0 && (
        <div className="text-3xl font-bold text-gray-700 flex items-center justify-center">
          +
        </div>
      )}

      {/* Added bananas */}
      {[...Array(addedFood)].map((_, i) => (
        <img
          key={`added-${i}`}
          src="/banana.png"
          alt="banana"
          className="h-14 w-14 sm:h-16 sm:w-16 object-contain"
        />
      ))}
    </div>

      </div>

      {/* Feed Buttons */}
      <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-6 px-4 sm:px-6 w-full">
        <button
          onClick={() => {
            if (current.available + addedFood < 10) {
              handleAddFood();
            }
          }}
          className="w-full sm:w-56 aspect-square sm:aspect-auto sm:h-20 bg-yellow-400 hover:bg-yellow-500 text-black rounded-xl text-xl font-comic shadow-md transition flex items-center justify-center"
        >
          Add More Bananas<img
          src="/banana.png"
          alt="banana"
          className="h-6 w-6 sm:h-8 sm:w-8 object-contain"
        />
        </button>
          {/*Feed Monkey Button */}
        <button
          onClick={handleFeedMonkey}
          className={`w-full sm:w-60 aspect-square sm:aspect-auto sm:h-20 ${
            current.available + addedFood > 10
              ? 'bg-red-600'
              : 'bg-green-500 hover:bg-green-600'
          } text-white rounded-xl text-xl font-comic shadow-md transition flex items-center justify-center`}
        >
          Feed Monkey
        </button>
      </div>
    </>
  )}  
</LessonLayout>

  );
};

export default AddFeedMonkey;
