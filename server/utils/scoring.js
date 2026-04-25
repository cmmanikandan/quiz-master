/**
 * NexQuiz Scoring Engine
 * Hardened logic for calculating attempt grades
 */

const calculateScore = (questions, studentAnswers, negMarking = 0) => {
    let score = 0;
    const reviewedAnswers = [];

    for (const q of questions) {
        // Safe find: Handle case where answers array is missing or empty
        const userAnswer = (studentAnswers || []).find(a => a.question_id === q.id);
        let isCorrect = false;

        // Rule: Only grade if both a user answer and a reference answer exist
        if (userAnswer && userAnswer.selected_option && q.correct_option) {
            const uAns = userAnswer.selected_option.toString().trim().toLowerCase();
            const cAns = q.correct_option.toString().trim().toLowerCase();

            // Support Mcq, TF, Short, and Blank
            if (q.type === 'mcq' || q.type === 'tf' || q.type === 'short' || q.type === 'blank') {
                isCorrect = uAns === cAns;
            } else if (q.type === 'matching') {
                // Matching requires exact casing/string match
                isCorrect = userAnswer.selected_option === q.correct_option;
            }

            if (isCorrect) {
                score += parseFloat(q.points || 1);
            } else {
                score -= parseFloat(negMarking || 0);
            }
        }

        reviewedAnswers.push({
            question_id: q.id,
            selected_option: userAnswer ? (userAnswer.selected_option || null) : null,
            is_correct: isCorrect,
            points_earned: isCorrect ? parseFloat(q.points || 1) : -parseFloat(negMarking || 0)
        });
    }

    return { score, reviewedAnswers };
};

module.exports = { calculateScore };
