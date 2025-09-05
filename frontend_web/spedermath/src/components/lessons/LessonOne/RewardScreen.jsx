import React, { useEffect } from 'react';

const RewardScreen = () => {
  useEffect(() => {
    const audio = new Audio('/audio/reward.mp3');
    audio.play();
  }, []);

  return (
    <div className="screen" style={{ textAlign: 'center', marginTop: '50px' }}>
      <h1>You did it! 🎉</h1>

      {/* Placeholder reward box */}
      <div
        style={{
          width: '150px',
          height: '150px',
          backgroundColor: '#FFD700',
          margin: '20px auto',
          borderRadius: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '60px',
        }}
      >
        ⭐
      </div>

      <p style={{ fontSize: '20px', marginTop: '20px' }}>
        You learned the numbers <strong>1, 2, and 3</strong>!
      </p>

      <button
        onClick={() => window.location.href = '/student-dashboard'}
        style={{
          marginTop: '30px',
          padding: '10px 20px',
          fontSize: '16px',
          borderRadius: '10px',
          cursor: 'pointer',
        }}
      >
        Back to Dashboard
      </button>
    </div>
  );
};

export default RewardScreen;
