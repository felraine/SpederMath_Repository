const generateLessons = (count = 10) => {
    const lessons = [];
  
    for (let i = 0; i < count; i++) {
      const start = Math.floor(Math.random() * 10);//random num gen
      const sequence = Array.from({ length: 4 }, (_, index) => start + index);
  
      const missingIndex = Math.floor(Math.random() * 4);
      const correct = sequence[missingIndex];
      sequence[missingIndex] = null;
  
      //generate other 3 choices
      const choicesSet = new Set([correct]);
      while (choicesSet.size < 4) {
        const offset = Math.floor(Math.random() * 7) - 3; // random num gen
        const candidate = correct + offset;
        if (candidate >= 0) {
          choicesSet.add(candidate);
        }
      }
  
      lessons.push({
        sequence,
        correct,
        choices: Array.from(choicesSet).sort(() => Math.random() - 0.5),
      });
    }
  
    return lessons;
  };
  
  export { generateLessons };  