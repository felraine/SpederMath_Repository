import React, { useState } from 'react';
import axios from 'axios';

const Test = () => {
    const [lessonId, setLessonId] = useState(1); // Default to lesson 1
    const [score, setScore] = useState(0);
    const [status, setStatus] = useState('IN_PROGRESS');
    const [unlocked, setUnlocked] = useState(false);

    const studentId = 1; // Example student ID. Replace with actual from JWT or login state.

    // Submit student progress
    const submitProgress = async () => {
        const updatedProgress = { 
            score, 
            status, 
            unlocked, 
            lesson: { lessonID: lessonId }
        };
        try {
            const response = await axios.post('/api/student-progress/submit', updatedProgress, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('jwtToken')}` // Replace with actual JWT token
                }
            });
            alert('Progress submitted successfully!');
        } catch (error) {
            console.error('Error submitting progress', error);
            alert('Failed to submit progress');
        }
    };

    // Save partial progress
    const savePartialProgress = async () => {
        const updatedProgress = { 
            score, 
            status, 
            unlocked, 
            lesson: { lessonID: lessonId }
        };
        try {
            const response = await axios.post('/api/student-progress/save', updatedProgress, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('jwtToken')}` // Replace with actual JWT token
                }
            });
            alert('Partial progress saved!');
        } catch (error) {
            console.error('Error saving partial progress', error);
            alert('Failed to save progress');
        }
    };

    return (
        <div style={{ fontFamily: 'Arial, sans-serif', padding: '20px' }}>
            <h1 style={{ color: '#333' }}>Submit Student Progress</h1>

            {/* Submit Progress Form */}
            <div style={{ marginBottom: '20px' }}>
                <h2>Submit Progress</h2>
                <form onSubmit={(e) => { e.preventDefault(); submitProgress(); }}>
                    <label style={{ display: 'block', marginBottom: '10px' }}>
                        Score:
                        <input
                            type="number"
                            value={score}
                            onChange={(e) => setScore(e.target.value)}
                            placeholder="Enter score"
                            style={{ padding: '8px', fontSize: '16px', width: '200px', marginBottom: '10px' }}
                        />
                    </label>
                    <br />
                    <label style={{ display: 'block', marginBottom: '10px' }}>
                        Status:
                        <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ padding: '8px', fontSize: '16px', width: '220px', marginBottom: '10px' }}>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="COMPLETED">Completed</option>
                        </select>
                    </label>
                    <br />
                    <label style={{ display: 'block', marginBottom: '10px' }}>
                        Unlocked:
                        <input
                            type="checkbox"
                            checked={unlocked}
                            onChange={() => setUnlocked(!unlocked)}
                            style={{ marginBottom: '10px' }}
                        />
                    </label>
                    <br />
                    <button type="submit" style={buttonStyles}>Submit Progress</button>
                </form>
            </div>

            {/* Save Partial Progress */}
            <div>
                <h2>Save Partial Progress</h2>
                <button onClick={savePartialProgress} style={buttonStyles}>Save Progress</button>
            </div>
        </div>
    );
};

// Button style
const buttonStyles = {
    padding: '10px 20px',
    fontSize: '16px',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    cursor: 'pointer',
    marginTop: '10px',
    transition: 'background-color 0.3s ease',
};

export default Test;
