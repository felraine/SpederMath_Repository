import React from 'react';

const GameScreen = ({ onNext }) => {
  const handleTap = (count) => {
    if (count === 1) {
      new Audio('/audio/correct.mp3').play();
      setTimeout(() => onNext(), 1000);
    } else {
      new Audio('/audio/wrong.mp3').play();
    }
  };

  const renderObjects = (count) => (
    <div onClick={() => handleTap(count)} style={{ cursor: 'pointer' }}>
      {[...Array(count)].map((_, i) => (
        <img
          key={i}
          src="/photos/lesson1/balloon.png"
          alt={`${count} balloons`}
          style={{ width: '50px', margin: '0 4px' }}
        />
      ))}
    </div>
  );

  return (
    <div className="screen">
      <h2>Tap the one!</h2>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '60px', marginTop: '30px' }}>
        {renderObjects(3)} {/* ❌ Wrong */}
        {renderObjects(1)} {/* ✅ Correct */}
        {renderObjects(2)} {/* ❌ Wrong */}
      </div>
    </div>
  );
};

export default GameScreen;
